<?php

namespace App\Services;

use App\Models\Hashtag;
use App\Models\Poll;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\ScheduledPost;
use App\Models\User;
use App\Notifications\SocialNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\CursorPaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PostService
{
    public function createPost(User $author, array $data, array $files = []): Post
    {
        return DB::transaction(function () use ($author, $data, $files) {
            if (! empty($data['scheduled_for'])) {
                $mediaPaths = $this->storeFilesTemporarily($files);
                ScheduledPost::create([
                    'user_id' => $author->id,
                    'content' => $data['content'] ?? null,
                    'media_paths' => $mediaPaths,
                    'poll_data' => $data['poll'] ?? null,
                    'visibility' => $data['visibility'] ?? 'public',
                    'location' => $data['location'] ?? null,
                    'scheduled_for' => $data['scheduled_for'],
                    'status' => 'pending',
                ]);
            }

            $post = Post::create([
                'user_id' => $author->id,
                'parent_id' => $data['parent_id'] ?? null,
                'repost_of_id' => $data['repost_of_id'] ?? null,
                'content' => $data['content'] ?? null,
                'visibility' => $data['visibility'] ?? 'public',
                'reply_policy' => $data['reply_policy'] ?? ($author->settings?->who_can_reply ?? 'everyone'),
                'location' => $data['location'] ?? null,
                'is_quote' => ! empty($data['repost_of_id']) && ! empty($data['content']),
                'published_at' => now(),
            ]);

            if (! empty($files)) {
                $this->attachMedia($post, $files);
            }

            if (! empty($data['gif_url'])) {
                PostMedia::create([
                    'post_id' => $post->id,
                    'type' => 'gif',
                    'file_path' => $data['gif_url'],
                    'mime_type' => 'image/gif',
                    'sort_order' => count($files),
                ]);
            }

            if (! empty($data['poll']['options']) && count($data['poll']['options']) >= 2) {
                $hours = (int) ($data['poll']['duration_hours'] ?? config('pulse.poll_default_hours', 24));
                $poll = Poll::create([
                    'post_id' => $post->id,
                    'question' => $data['poll']['question'] ?? null,
                    'expires_at' => now()->addHours(max(1, min(168, $hours))),
                ]);

                foreach (array_values($data['poll']['options']) as $index => $optionText) {
                    $poll->options()->create([
                        'option_text' => trim((string) $optionText),
                        'sort_order' => $index,
                    ]);
                }
            }

            $this->syncHashtags($post);
            $this->notifyMentions($post, $author);

            if ($post->parent_id) {
                $parent = Post::with('user')->find($post->parent_id);
                if ($parent) {
                    $parent->increment('replies_count');
                    if ($parent->user_id !== $author->id) {
                        $parent->user->notify(new SocialNotification(
                            'reply',
                            $author,
                            "{$author->name} replied to your post",
                            ['post_id' => $post->id, 'parent_id' => $parent->id]
                        ));
                    }
                }
            } else {
                $author->profile()->increment('posts_count');
            }

            if ($post->repost_of_id && $post->is_quote) {
                $original = Post::with('user')->find($post->repost_of_id);
                if ($original) {
                    $original->increment('reposts_count');
                    if ($original->user_id !== $author->id) {
                        $original->user->notify(new SocialNotification(
                            'quote',
                            $author,
                            "{$author->name} quoted your post",
                            ['post_id' => $post->id, 'original_post_id' => $original->id]
                        ));
                    }
                }
            }

            Cache::forget('sidebar_trending_hashtags');

            return $post->load($this->defaultRelations($author->id));
        });
    }

    public function getFeed(?User $viewer, string $tab = 'for_you', int $perPage = 15): CursorPaginator
    {
        $viewerId = $viewer?->id;

        $query = Post::query()
            ->with($this->defaultRelations($viewerId))
            ->published()
            ->topLevel()
            ->whereHas('user', fn (Builder $q) => $q->where('is_suspended', false)->where('is_deactivated', false));

        if ($viewer) {
            $blockedIds = $viewer->blockedUsers()->pluck('users.id')
                ->merge($viewer->blockedByUsers()->pluck('users.id'))
                ->unique()
                ->toArray();
            $mutedIds = $viewer->mutedUsers()->pluck('users.id')->toArray();
            $excludeIds = array_unique(array_merge($blockedIds, $mutedIds));

            if (! empty($excludeIds)) {
                $query->whereNotIn('user_id', $excludeIds);
            }

            $followingIds = $viewer->following()->pluck('users.id')->toArray();

            if ($tab === 'following') {
                $query->whereIn('user_id', array_merge($followingIds, [$viewer->id]));
            }

            $query->where(function (Builder $q) use ($viewer, $followingIds) {
                $q->where(function (Builder $pub) {
                    $pub->where('visibility', 'public')
                        ->whereHas('user', fn (Builder $u) => $u->where('is_private', false));
                })->orWhere('user_id', $viewer->id);

                if (! empty($followingIds)) {
                    $q->orWhere(function (Builder $fol) use ($followingIds) {
                        $fol->whereIn('user_id', $followingIds)
                            ->whereIn('visibility', ['public', 'followers']);
                    });
                }
            });
        } else {
            $query->where('visibility', 'public')
                ->whereHas('user', fn (Builder $u) => $u->where('is_private', false));
        }

        $isSqlite = DB::getDriverName() === 'sqlite';

        match ($tab) {
            'trending' => $query->orderByRaw('(likes_count * 2 + reposts_count * 3 + replies_count * 2) DESC')->orderByDesc('created_at'),
            'for_you' => $isSqlite
                ? $query->orderByRaw('(likes_count * 2 + reposts_count * 3 + replies_count) DESC')->orderByDesc('created_at')
                : $query->orderByRaw('((likes_count * 2 + reposts_count * 3 + replies_count) / POW(GREATEST(TIMESTAMPDIFF(HOUR, created_at, NOW()), 1), 1.3)) DESC')->orderByDesc('created_at'),
            default => $query->orderByDesc('created_at'),
        };

        return $query->cursorPaginate($perPage)->withQueryString();
    }

    public function defaultRelations(?int $viewerId = null): array
    {
        return [
            'user.profile',
            'media',
            'poll.options',
            'repostOf.user.profile',
            'repostOf.media',
            'likedBy' => fn ($q) => $viewerId ? $q->where('users.id', $viewerId) : $q->whereRaw('1 = 0'),
            'repostedBy' => fn ($q) => $viewerId ? $q->where('users.id', $viewerId) : $q->whereRaw('1 = 0'),
            'bookmarkedBy' => fn ($q) => $viewerId ? $q->where('users.id', $viewerId) : $q->whereRaw('1 = 0'),
        ];
    }

    public function toggleLike(User $user, Post $post): array
    {
        return DB::transaction(function () use ($user, $post) {
            $exists = DB::table('post_likes')
                ->where('user_id', $user->id)
                ->where('post_id', $post->id)
                ->exists();

            if ($exists) {
                $user->likes()->detach($post->id);
                $post->decrement('likes_count');
                $liked = false;
            } else {
                $user->likes()->attach($post->id);
                $post->increment('likes_count');
                $liked = true;

                if ($post->user_id !== $user->id) {
                    $post->user->notify(new SocialNotification(
                        'like',
                        $user,
                        "{$user->name} liked your post",
                        ['post_id' => $post->id]
                    ));
                }
            }

            return ['liked' => $liked, 'likes_count' => $post->fresh()->likes_count];
        });
    }

    public function toggleRepost(User $user, Post $post): array
    {
        return DB::transaction(function () use ($user, $post) {
            $exists = DB::table('post_reposts')
                ->where('user_id', $user->id)
                ->where('post_id', $post->id)
                ->exists();

            if ($exists) {
                $user->reposts()->detach($post->id);
                $post->decrement('reposts_count');
                $reposted = false;
            } else {
                $user->reposts()->attach($post->id);
                $post->increment('reposts_count');
                $reposted = true;

                if ($post->user_id !== $user->id) {
                    $post->user->notify(new SocialNotification(
                        'repost',
                        $user,
                        "{$user->name} reposted your post",
                        ['post_id' => $post->id]
                    ));
                }
            }

            return ['reposted' => $reposted, 'reposts_count' => $post->fresh()->reposts_count];
        });
    }

    public function toggleBookmark(User $user, Post $post): array
    {
        return DB::transaction(function () use ($user, $post) {
            $exists = DB::table('post_bookmarks')
                ->where('user_id', $user->id)
                ->where('post_id', $post->id)
                ->exists();

            if ($exists) {
                $user->bookmarks()->detach($post->id);
                $post->decrement('bookmarks_count');
                $bookmarked = false;
            } else {
                $user->bookmarks()->attach($post->id);
                $post->increment('bookmarks_count');
                $bookmarked = true;
            }

            return ['bookmarked' => $bookmarked, 'bookmarks_count' => $post->fresh()->bookmarks_count];
        });
    }

    public function deletePost(Post $post): void
    {
        DB::transaction(function () use ($post) {
            foreach ($post->media as $media) {
                if (! str_starts_with($media->file_path, 'http')) {
                    Storage::disk('public')->delete($media->file_path);
                }
            }

            if ($post->parent_id) {
                Post::where('id', $post->parent_id)->where('replies_count', '>', 0)->decrement('replies_count');
            } else {
                $post->user->profile()->where('posts_count', '>', 0)->decrement('posts_count');
            }

            $post->delete();
        });
    }

    private function attachMedia(Post $post, array $files): void
    {
        foreach (array_values($files) as $index => $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $mime = $file->getMimeType() ?? 'application/octet-stream';
            $type = str_starts_with($mime, 'video/') ? 'video' : ($mime === 'image/gif' ? 'gif' : 'image');
            $path = $file->store('posts/'.$post->user_id, 'public');

            PostMedia::create([
                'post_id' => $post->id,
                'type' => $type,
                'file_path' => $path,
                'mime_type' => $mime,
                'file_size' => $file->getSize(),
                'sort_order' => $index,
            ]);
        }
    }

    private function storeFilesTemporarily(array $files): array
    {
        $paths = [];
        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $paths[] = $file->store('scheduled', 'public');
            }
        }

        return $paths;
    }

    private function syncHashtags(Post $post): void
    {
        if (! $post->content) {
            return;
        }

        preg_match_all('/#([a-zA-Z0-9_]{2,50})/', $post->content, $matches);
        $tags = array_unique(array_map('strtolower', $matches[1] ?? []));

        if (empty($tags)) {
            return;
        }

        $hashtagIds = [];
        foreach ($tags as $tag) {
            $hashtag = Hashtag::firstOrCreate(
                ['name' => $tag],
                ['slug' => Str::slug($tag) ?: $tag]
            );

            if (! $hashtag->is_restricted) {
                $hashtagIds[] = $hashtag->id;
                $hashtag->increment('posts_count');
            }
        }

        $post->hashtags()->sync($hashtagIds);
    }

    private function notifyMentions(Post $post, User $author): void
    {
        if (! $post->content) {
            return;
        }

        preg_match_all('/@([a-zA-Z0-9_]{2,30})/', $post->content, $matches);
        $usernames = array_unique(array_map('strtolower', $matches[1] ?? []));

        if (empty($usernames)) {
            return;
        }

        $mentionedUsers = User::with('settings')
            ->whereIn('username', $usernames)
            ->where('id', '!=', $author->id)
            ->get();

        foreach ($mentionedUsers as $target) {
            $policy = $target->settings?->who_can_mention ?? 'everyone';
            if ($policy === 'nobody') {
                continue;
            }
            if ($policy === 'following' && ! $target->isFollowing($author)) {
                continue;
            }
            if ($target->isBlocked($author)) {
                continue;
            }

            $target->notify(new SocialNotification(
                'mention',
                $author,
                "{$author->name} mentioned you in a post",
                ['post_id' => $post->id]
            ));
        }
    }
}
