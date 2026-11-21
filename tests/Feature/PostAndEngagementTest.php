<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostAndEngagementTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithProfile(string $username): User
    {
        $user = User::factory()->create(['username' => $username]);
        $user->profile()->create();
        $user->settings()->create();

        return $user;
    }

    public function test_user_can_create_post_with_hashtags_and_poll(): void
    {
        $user = $this->createUserWithProfile('alice');

        $this->actingAs($user)
            ->post('/posts', [
                'content' => 'Hello #Pulse world!',
                'visibility' => 'public',
                'poll' => [
                    'options' => ['Option A', 'Option B'],
                    'duration_hours' => 24,
                ],
            ])
            ->assertRedirect();

        $post = Post::where('user_id', $user->id)->firstOrFail();
        $this->assertDatabaseHas('hashtags', ['name' => 'pulse']);
        $this->assertNotNull($post->poll);

        $optionId = $post->poll->options->first()->id;

        $this->actingAs($user)
            ->postJson("/posts/{$post->id}/vote", ['option_id' => $optionId])
            ->assertOk()
            ->assertJsonPath('poll.total_votes', 1);

        // Duplicate vote prevented
        $this->actingAs($user)
            ->postJson("/posts/{$post->id}/vote", ['option_id' => $optionId])
            ->assertStatus(422);
    }

    public function test_user_can_like_repost_bookmark_and_reply(): void
    {
        $author = $this->createUserWithProfile('author');
        $viewer = $this->createUserWithProfile('viewer');

        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Original post',
            'visibility' => 'public',
            'published_at' => now(),
        ]);

        $this->actingAs($viewer)->postJson("/posts/{$post->id}/like")->assertOk()->assertJson(['liked' => true]);
        $this->actingAs($viewer)->postJson("/posts/{$post->id}/repost")->assertOk()->assertJson(['reposted' => true]);
        $this->actingAs($viewer)->postJson("/posts/{$post->id}/bookmark")->assertOk()->assertJson(['bookmarked' => true]);

        $this->actingAs($viewer)->post('/posts', [
            'parent_id' => $post->id,
            'content' => 'Great post!',
        ])->assertRedirect();

        $this->assertEquals(1, $post->fresh()->likes_count);
        $this->assertEquals(1, $post->fresh()->reposts_count);
        $this->assertEquals(1, $post->fresh()->replies_count);

        // Unauthorized delete blocked
        $this->actingAs($viewer)->delete("/posts/{$post->id}")->assertForbidden();
    }
}
