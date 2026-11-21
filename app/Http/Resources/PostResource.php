<?php

namespace App\Http\Resources;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Post */
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $viewerId = $viewer?->id;

        $isLiked = $this->relationLoaded('likedBy')
            ? $this->likedBy->contains('id', $viewerId)
            : ($viewerId ? $this->likedBy()->where('users.id', $viewerId)->exists() : false);

        $isReposted = $this->relationLoaded('repostedBy')
            ? $this->repostedBy->contains('id', $viewerId)
            : ($viewerId ? $this->repostedBy()->where('users.id', $viewerId)->exists() : false);

        $isBookmarked = $this->relationLoaded('bookmarkedBy')
            ? $this->bookmarkedBy->contains('id', $viewerId)
            : ($viewerId ? $this->bookmarkedBy()->where('users.id', $viewerId)->exists() : false);

        $pollData = null;
        if ($this->relationLoaded('poll') && $this->poll) {
            $userVoteOptionId = null;
            if ($viewerId) {
                $userVoteOptionId = $this->poll->votes()
                    ->where('user_id', $viewerId)
                    ->value('poll_option_id');
            }

            $pollData = [
                'id' => $this->poll->id,
                'question' => $this->poll->question,
                'expires_at' => $this->poll->expires_at->toISOString(),
                'is_expired' => $this->poll->isExpired(),
                'total_votes' => $this->poll->total_votes,
                'user_voted_option_id' => $userVoteOptionId,
                'options' => $this->poll->options->map(fn ($opt) => [
                    'id' => $opt->id,
                    'option_text' => $opt->option_text,
                    'votes_count' => $opt->votes_count,
                    'percentage' => $this->poll->total_votes > 0
                        ? round(($opt->votes_count / $this->poll->total_votes) * 100)
                        : 0,
                ])->values(),
            ];
        }

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'parent_id' => $this->parent_id,
            'repost_of_id' => $this->repost_of_id,
            'content' => $this->content,
            'visibility' => $this->visibility,
            'reply_policy' => $this->reply_policy,
            'location' => $this->location,
            'is_pinned' => $this->is_pinned,
            'is_quote' => $this->is_quote,
            'likes_count' => $this->likes_count,
            'reposts_count' => $this->reposts_count,
            'replies_count' => $this->replies_count,
            'bookmarks_count' => $this->bookmarks_count,
            'views_count' => $this->views_count,
            'is_liked' => $isLiked,
            'is_reposted' => $isReposted,
            'is_bookmarked' => $isBookmarked,
            'created_at' => $this->created_at?->toISOString(),
            'created_human' => $this->created_at?->diffForHumans(),
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username,
                'is_verified' => $this->user->is_verified,
                'is_private' => $this->user->is_private,
                'avatar_url' => $this->user->profile?->avatar_url,
            ],
            'media' => $this->relationLoaded('media') ? $this->media->map(fn ($m) => [
                'id' => $m->id,
                'type' => $m->type,
                'url' => $m->url,
                'alt_text' => $m->alt_text,
            ])->values() : [],
            'poll' => $pollData,
            'repost_of' => ($this->relationLoaded('repostOf') && $this->repostOf)
                ? (new PostResource($this->repostOf))->resolve($request)
                : null,
        ];
    }
}
