<?php

namespace App\Services;

use App\Models\FollowRequest;
use App\Models\User;
use App\Notifications\SocialNotification;
use Illuminate\Support\Facades\DB;

class FollowService
{
    public function toggleFollow(User $actor, User $target): array
    {
        if ($actor->id === $target->id) {
            return ['status' => 'self'];
        }

        if ($actor->isBlocked($target) || $target->isBlocked($actor)) {
            return ['status' => 'blocked'];
        }

        return DB::transaction(function () use ($actor, $target) {
            if ($actor->isFollowing($target)) {
                $actor->following()->detach($target->id);
                $actor->profile()->where('following_count', '>', 0)->decrement('following_count');
                $target->profile()->where('followers_count', '>', 0)->decrement('followers_count');

                return ['status' => 'unfollowed', 'following' => false, 'requested' => false];
            }

            if ($target->is_private) {
                $existing = FollowRequest::where('sender_id', $actor->id)
                    ->where('receiver_id', $target->id)
                    ->where('status', 'pending')
                    ->first();

                if ($existing) {
                    $existing->delete();

                    return ['status' => 'request_cancelled', 'following' => false, 'requested' => false];
                }

                FollowRequest::updateOrCreate(
                    ['sender_id' => $actor->id, 'receiver_id' => $target->id],
                    ['status' => 'pending']
                );

                $target->notify(new SocialNotification(
                    'follow_request',
                    $actor,
                    "{$actor->name} requested to follow you",
                    ['sender_id' => $actor->id]
                ));

                return ['status' => 'requested', 'following' => false, 'requested' => true];
            }

            $actor->following()->attach($target->id);
            $actor->profile()->increment('following_count');
            $target->profile()->increment('followers_count');

            $target->notify(new SocialNotification(
                'follow',
                $actor,
                "{$actor->name} followed you",
                ['follower_id' => $actor->id]
            ));

            return ['status' => 'followed', 'following' => true, 'requested' => false];
        });
    }

    public function respondToFollowRequest(User $receiver, FollowRequest $request, bool $accept): void
    {
        DB::transaction(function () use ($receiver, $request, $accept) {
            if ($accept) {
                $request->update(['status' => 'accepted']);
                $sender = $request->sender;

                if (! $sender->isFollowing($receiver)) {
                    $sender->following()->attach($receiver->id);
                    $sender->profile()->increment('following_count');
                    $receiver->profile()->increment('followers_count');
                }

                $sender->notify(new SocialNotification(
                    'follow_request_approved',
                    $receiver,
                    "{$receiver->name} accepted your follow request",
                    ['user_id' => $receiver->id]
                ));
            } else {
                $request->update(['status' => 'rejected']);
            }
        });
    }

    public function removeFollower(User $user, User $follower): void
    {
        DB::transaction(function () use ($user, $follower) {
            if ($follower->isFollowing($user)) {
                $follower->following()->detach($user->id);
                $follower->profile()->where('following_count', '>', 0)->decrement('following_count');
                $user->profile()->where('followers_count', '>', 0)->decrement('followers_count');
            }
        });
    }

    public function toggleBlock(User $actor, User $target): bool
    {
        if ($actor->id === $target->id) {
            return false;
        }

        return DB::transaction(function () use ($actor, $target) {
            if ($actor->isBlocked($target)) {
                $actor->blockedUsers()->detach($target->id);

                return false;
            }

            $actor->blockedUsers()->attach($target->id);

            // Remove mutual follows and pending requests
            if ($actor->isFollowing($target)) {
                $actor->following()->detach($target->id);
                $actor->profile()->where('following_count', '>', 0)->decrement('following_count');
                $target->profile()->where('followers_count', '>', 0)->decrement('followers_count');
            }
            if ($target->isFollowing($actor)) {
                $target->following()->detach($actor->id);
                $target->profile()->where('following_count', '>', 0)->decrement('following_count');
                $actor->profile()->where('followers_count', '>', 0)->decrement('followers_count');
            }

            FollowRequest::where(function ($q) use ($actor, $target) {
                $q->where('sender_id', $actor->id)->where('receiver_id', $target->id);
            })->orWhere(function ($q) use ($actor, $target) {
                $q->where('sender_id', $target->id)->where('receiver_id', $actor->id);
            })->delete();

            return true;
        });
    }

    public function toggleMute(User $actor, User $target): bool
    {
        if ($actor->id === $target->id) {
            return false;
        }

        if ($actor->isMuted($target)) {
            $actor->mutedUsers()->detach($target->id);

            return false;
        }

        $actor->mutedUsers()->attach($target->id);

        return true;
    }
}
