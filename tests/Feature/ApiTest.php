<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_sanctum_token_and_protected_post_api(): void
    {
        $user = User::factory()->create(['username' => 'apiuser']);
        $user->profile()->create();
        $user->settings()->create();

        $tokenRes = $this->postJson('/api/v1/auth/token', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $token = $tokenRes->json('token');

        $this->withToken($token)
            ->postJson('/api/v1/posts', [
                'content' => 'Posted via REST API #api',
            ])
            ->assertCreated()
            ->assertJsonPath('post.content', 'Posted via REST API #api');
    }
}
