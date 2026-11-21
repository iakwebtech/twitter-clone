<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $viewer = $request->user();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'is_verified' => $this->is_verified,
            'is_private' => $this->is_private,
            'is_online' => $this->isOnline(),
            'last_seen_at' => $this->last_seen_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'bio' => $this->profile?->bio,
            'location' => $this->profile?->location,
            'website' => $this->profile?->website,
            'avatar_url' => $this->profile?->avatar_url,
            'cover_url' => $this->profile?->cover_url,
            'followers_count' => $this->profile?->followers_count ?? 0,
            'following_count' => $this->profile?->following_count ?? 0,
            'posts_count' => $this->profile?->posts_count ?? 0,
            'is_following' => $viewer ? $viewer->isFollowing($this->resource) : false,
            'has_pending_request' => $viewer ? $viewer->hasPendingFollowRequestTo($this->resource) : false,
            'is_blocked' => $viewer ? $viewer->isBlocked($this->resource) : false,
            'is_muted' => $viewer ? $viewer->isMuted($this->resource) : false,
        ];
    }
}
