<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Hashtag;
use App\Models\Message;
use App\Models\PlatformSetting;
use App\Models\Poll;
use App\Models\Post;
use App\Models\TrendingTopic;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Platform Settings
        PlatformSetting::setValue('site_name', 'Pulse', 'string', 'general');
        PlatformSetting::setValue('site_description', 'Real-time conversations, trending ideas, and community connections.', 'string', 'general');
        PlatformSetting::setValue('max_post_length', 280, 'integer', 'content');
        PlatformSetting::setValue('registration_enabled', true, 'boolean', 'security');
        PlatformSetting::setValue('maintenance_mode', false, 'boolean', 'general');

        // Admin Account
        $admin = User::create([
            'name' => 'Pulse Admin',
            'username' => 'admin',
            'email' => 'admin@pulse.local',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_verified' => true,
            'last_seen_at' => now(),
        ]);
        $admin->profile()->create([
            'bio' => 'Official Pulse platform administrator. Building a cleaner, faster social web.',
            'location' => 'San Francisco, CA',
            'website' => 'https://pulse.local',
            'followers_count' => 3,
            'following_count' => 2,
            'posts_count' => 2,
        ]);
        $admin->settings()->create();

        // Demo Users
        $demoUsersData = [
            [
                'name' => 'Maya Lin',
                'username' => 'mayalin',
                'email' => 'maya@pulse.local',
                'bio' => 'Staff Product Designer • Crafting interfaces & design systems ✨',
                'location' => 'New York, NY',
                'is_verified' => true,
            ],
            [
                'name' => 'Alex Rivera',
                'username' => 'arivera',
                'email' => 'alex@pulse.local',
                'bio' => 'Full-stack engineer shipping Laravel + React apps. Coffee enthusiast ☕',
                'location' => 'Austin, TX',
                'is_verified' => true,
            ],
            [
                'name' => 'Elena Vance',
                'username' => 'elenavance',
                'email' => 'elena@pulse.local',
                'bio' => 'Tech journalist & AI researcher. Opinions are my own.',
                'location' => 'London, UK',
                'is_verified' => false,
            ],
            [
                'name' => 'Marcus Chen',
                'username' => 'mchen',
                'email' => 'marcus@pulse.local',
                'bio' => 'Open source maintainer • Building real-time web tools',
                'location' => 'Seattle, WA',
                'is_verified' => true,
            ],
        ];

        $users = collect([$admin]);
        foreach ($demoUsersData as $data) {
            $u = User::create([
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'],
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'user',
                'is_verified' => $data['is_verified'],
                'last_seen_at' => now(),
            ]);
            $u->profile()->create([
                'bio' => $data['bio'],
                'location' => $data['location'],
                'followers_count' => 2,
                'following_count' => 2,
                'posts_count' => 2,
            ]);
            $u->settings()->create();
            $users->push($u);
        }

        // Follow relationships
        foreach ($users as $u) {
            $others = $users->where('id', '!=', $u->id)->take(2);
            foreach ($others as $target) {
                $u->following()->syncWithoutDetaching([$target->id]);
            }
        }

        // Hashtags
        $tags = ['laravel', 'reactjs', 'webdev', 'designsystems', 'ai', 'opensource'];
        $hashtagModels = [];
        foreach ($tags as $idx => $tag) {
            $hashtagModels[$tag] = Hashtag::create([
                'name' => $tag,
                'slug' => Str::slug($tag),
                'posts_count' => 12 - $idx,
                'is_trending' => $idx < 4,
            ]);
        }

        // Trending Topics
        TrendingTopic::insert([
            ['title' => 'Laravel 12 & Reverb', 'category' => 'Technology', 'posts_count' => 1420, 'score' => 98.5, 'is_active' => true, 'period' => '24h'],
            ['title' => 'Minimalist UI Design', 'category' => 'Design', 'posts_count' => 890, 'score' => 87.0, 'is_active' => true, 'period' => '24h'],
            ['title' => 'Open Source AI Tools', 'category' => 'AI & ML', 'posts_count' => 2310, 'score' => 95.2, 'is_active' => true, 'period' => '24h'],
            ['title' => 'TypeScript & React 19', 'category' => 'Engineering', 'posts_count' => 640, 'score' => 76.4, 'is_active' => true, 'period' => '7d'],
        ]);

        // Posts
        $post1 = Post::create([
            'user_id' => $admin->id,
            'content' => 'Welcome to Pulse! Real-time conversations, polls, direct messages, and communities—all built on #laravel and #reactjs.',
            'visibility' => 'public',
            'likes_count' => 42,
            'reposts_count' => 12,
            'replies_count' => 1,
            'views_count' => 410,
            'published_at' => now()->subHours(3),
        ]);
        $post1->hashtags()->attach([$hashtagModels['laravel']->id, $hashtagModels['reactjs']->id]);

        $post2 = Post::create([
            'user_id' => $users[1]->id,
            'content' => 'Nothing beats a crisp three-column layout with instant dark mode and zero visual clutter. #designsystems #webdev',
            'visibility' => 'public',
            'likes_count' => 28,
            'reposts_count' => 5,
            'views_count' => 290,
            'published_at' => now()->subHours(2),
        ]);
        $post2->hashtags()->attach([$hashtagModels['designsystems']->id, $hashtagModels['webdev']->id]);

        // Reply to post1
        Post::create([
            'user_id' => $users[2]->id,
            'parent_id' => $post1->id,
            'content' => 'Love how snappy the feed feels! Excited to see where @admin takes Pulse next.',
            'visibility' => 'public',
            'likes_count' => 9,
            'published_at' => now()->subHour(),
        ]);

        // Poll post
        $pollPost = Post::create([
            'user_id' => $users[2]->id,
            'content' => 'What is your favorite stack for building real-time web apps in 2026? #webdev #opensource',
            'visibility' => 'public',
            'likes_count' => 35,
            'reposts_count' => 8,
            'views_count' => 512,
            'published_at' => now()->subMinutes(45),
        ]);
        $pollPost->hashtags()->attach([$hashtagModels['webdev']->id, $hashtagModels['opensource']->id]);

        $poll = Poll::create([
            'post_id' => $pollPost->id,
            'question' => 'Favorite real-time stack?',
            'expires_at' => now()->addHours(48),
            'total_votes' => 24,
        ]);
        $poll->options()->createMany([
            ['option_text' => 'Laravel + Inertia + Reverb', 'votes_count' => 14, 'sort_order' => 0],
            ['option_text' => 'Next.js + WebSockets', 'votes_count' => 6, 'sort_order' => 1],
            ['option_text' => 'Phoenix LiveView', 'votes_count' => 4, 'sort_order' => 2],
        ]);

        // Direct Conversation
        $conv = Conversation::create([
            'type' => 'direct',
            'created_by' => $admin->id,
            'last_message_at' => now()->subMinutes(10),
        ]);
        $conv->participants()->attach([
            $admin->id => ['role' => 'member', 'last_read_at' => now()],
            $users[1]->id => ['role' => 'member', 'last_read_at' => now()->subMinutes(20)],
        ]);
        Message::create([
            'conversation_id' => $conv->id,
            'sender_id' => $users[1]->id,
            'body' => 'Hey! The new Pulse UI looks super clean. Ready for launch?',
            'created_at' => now()->subMinutes(10),
        ]);
    }
}
