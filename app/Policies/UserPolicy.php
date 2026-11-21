<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewProfile(?User $viewer, User $target): bool
    {
        if ($target->is_suspended || $target->is_deactivated) {
            return $viewer?->isAdmin() ?? false;
        }

        if ($viewer && ($target->isBlocked($viewer) || $viewer->isBlocked($target))) {
            return false;
        }

        return true;
    }

    public function viewPosts(?User $viewer, User $target): bool
    {
        if (! $this->viewProfile($viewer, $target)) {
            return false;
        }

        if (! $target->is_private) {
            return true;
        }

        if (! $viewer) {
            return false;
        }

        return $viewer->id === $target->id || $viewer->isFollowing($target);
    }

    public function message(User $sender, User $recipient): bool
    {
        if ($sender->id === $recipient->id) {
            return false;
        }

        if ($recipient->isBlocked($sender) || $sender->isBlocked($recipient)) {
            return false;
        }

        $policy = $recipient->settings?->who_can_message ?? 'everyone';

        return match ($policy) {
            'nobody' => false,
            'following' => $recipient->isFollowing($sender),
            default => true,
        };
    }
}
