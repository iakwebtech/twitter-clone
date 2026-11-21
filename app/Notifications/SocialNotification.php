<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class SocialNotification extends Notification implements ShouldBroadcastNow
{
    use Queueable;

    public function __construct(
        public string $kind,
        public User $actor,
        public string $message,
        public array $meta = [],
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $this->actor->loadMissing('profile');

        return [
            'kind' => $this->kind,
            'message' => $this->message,
            'actor' => [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
                'username' => $this->actor->username,
                'is_verified' => $this->actor->is_verified,
                'avatar_url' => $this->actor->profile?->avatar_url,
            ],
            'meta' => $this->meta,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'data' => $this->toArray($notifiable),
            'read_at' => null,
            'created_at' => now()->toISOString(),
        ]);
    }

    public function broadcastOn(): array
    {
        return [];
    }
}
