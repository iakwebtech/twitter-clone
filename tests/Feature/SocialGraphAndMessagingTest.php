<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\FollowRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SocialGraphAndMessagingTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(string $username, array $attrs = []): User
    {
        $user = User::factory()->create(array_merge(['username' => $username], $attrs));
        $user->profile()->create();
        $user->settings()->create();

        return $user;
    }

    public function test_private_account_follow_request_and_approval(): void
    {
        $sender = $this->createUser('sender');
        $privateUser = $this->createUser('private_user', ['is_private' => true]);

        $this->actingAs($sender)
            ->postJson("/users/{$privateUser->id}/follow")
            ->assertOk()
            ->assertJson(['status' => 'requested', 'requested' => true]);

        $req = FollowRequest::where('sender_id', $sender->id)->where('receiver_id', $privateUser->id)->firstOrFail();

        $this->actingAs($privateUser)
            ->postJson("/follow-requests/{$req->id}/respond", ['accept' => true])
            ->assertOk()
            ->assertJson(['status' => 'accepted']);

        $this->assertTrue($sender->fresh()->isFollowing($privateUser));
    }

    public function test_direct_messaging_and_admin_authorization(): void
    {
        $u1 = $this->createUser('userone');
        $u2 = $this->createUser('usertwo');
        $admin = $this->createUser('boss', ['role' => 'admin']);

        $this->actingAs($u1)->post("/messages/direct/{$u2->id}")->assertRedirect();
        $conv = Conversation::firstOrFail();

        $this->actingAs($u1)
            ->postJson("/messages/{$conv->id}/send", ['body' => 'Hello there!'])
            ->assertCreated()
            ->assertJsonPath('message.body', 'Hello there!');

        // Non-admin blocked from admin dashboard
        $this->actingAs($u1)->get('/admin')->assertForbidden();
        $this->actingAs($admin)->get('/admin')->assertOk();
    }
}
