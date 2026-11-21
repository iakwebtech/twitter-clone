<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthAndProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_check_username(): void
    {
        $this->getJson('/check-username?username=janedoe')
            ->assertOk()
            ->assertJson(['available' => true, 'valid' => true]);

        $response = $this->post('/register', [
            'name' => 'Jane Doe',
            'username' => 'janedoe',
            'email' => 'jane@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertRedirect('/');
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['username' => 'janedoe']);
        $this->assertDatabaseHas('user_profiles', ['user_id' => User::where('username', 'janedoe')->first()->id]);
    }

    public function test_user_can_login_and_update_profile(): void
    {
        $user = User::factory()->create(['username' => 'johnsmith']);
        $user->profile()->create();
        $user->settings()->create();

        $this->post('/login', [
            'login' => 'johnsmith',
            'password' => 'password',
        ])->assertRedirect('/');

        $this->actingAs($user)
            ->post('/profile', [
                'name' => 'John Updated',
                'username' => 'johnsmith',
                'bio' => 'Building cool things',
                'location' => 'Remote',
            ])
            ->assertRedirect('/@johnsmith');

        $this->assertDatabaseHas('user_profiles', [
            'user_id' => $user->id,
            'bio' => 'Building cool things',
        ]);
    }
}
