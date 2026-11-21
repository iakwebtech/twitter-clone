<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function view(?User $viewer, Post $post): bool
    {
        if ($post->user->is_suspended || $post->user->is_deactivated) {
            return $viewer?->isAdmin() ?? false;
        }

        if ($viewer && ($post->user->isBlocked($viewer) || $viewer->isBlocked($post->user))) {
            return false;
        }

        if ($post->visibility === 'private') {
            return $viewer && $viewer->id === $post->user_id;
        }

        if ($post->visibility === 'followers' || $post->user->is_private) {
            if (! $viewer) {
                return false;
            }

            return $viewer->id === $post->user_id || $viewer->isFollowing($post->user);
        }

        return true;
    }

    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->isAdmin();
    }

    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->isModerator();
    }

    public function reply(User $user, Post $post): bool
    {
        if (! $this->view($user, $post)) {
            return false;
        }

        if ($user->id === $post->user_id) {
            return true;
        }

        if ($post->reply_policy === 'following') {
            return $post->user->isFollowing($user);
        }

        if ($post->reply_policy === 'mentioned') {
            return str_contains(strtolower((string) $post->content), '@'.strtolower($user->username));
        }

        return true;
    }
}
