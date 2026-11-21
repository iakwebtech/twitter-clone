<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message)
    {
        $this->message->loadMissing(['sender.profile', 'attachments', 'replyTo.sender']);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.'.$this->message->conversation_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
            'body' => $this->message->body,
            'created_at' => $this->message->created_at?->toISOString(),
            'sender' => [
                'id' => $this->message->sender->id,
                'name' => $this->message->sender->name,
                'username' => $this->message->sender->username,
                'avatar_url' => $this->message->sender->profile?->avatar_url,
            ],
            'attachments' => $this->message->attachments->map(fn ($a) => [
                'id' => $a->id,
                'type' => $a->type,
                'file_name' => $a->file_name,
                'url' => $a->url,
            ]),
            'reply_to' => $this->message->replyTo ? [
                'id' => $this->message->replyTo->id,
                'body' => $this->message->replyTo->body,
                'sender_name' => $this->message->replyTo->sender?->name,
            ] : null,
        ];
    }
}
