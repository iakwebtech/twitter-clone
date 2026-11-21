<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 30)->unique()->after('name');
            $table->enum('role', ['user', 'moderator', 'admin'])->default('user')->after('password');
            $table->boolean('is_verified')->default(false)->after('role');
            $table->boolean('is_private')->default(false)->after('is_verified');
            $table->boolean('is_suspended')->default(false)->after('is_private');
            $table->boolean('is_deactivated')->default(false)->after('is_suspended');
            $table->timestamp('deactivated_at')->nullable()->after('is_deactivated');
            $table->timestamp('last_seen_at')->nullable()->after('deactivated_at');
            $table->softDeletes();

            $table->index(['role', 'is_suspended']);
            $table->index('last_seen_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role', 'is_suspended']);
            $table->dropIndex(['last_seen_at']);
            $table->dropColumn([
                'username',
                'role',
                'is_verified',
                'is_private',
                'is_suspended',
                'is_deactivated',
                'deactivated_at',
                'last_seen_at',
                'deleted_at',
            ]);
        });
    }
};
