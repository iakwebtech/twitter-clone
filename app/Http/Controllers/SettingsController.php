<?php

namespace App\Http\Controllers;

use App\Http\Requests\Settings\UpdateSettingsRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user()->load('settings');

        return Inertia::render('Settings/Index', [
            'settings' => $user->settings,
            'isPrivate' => $user->is_private,
            'loginActivities' => $user->loginActivities()->latest('logged_in_at')->limit(15)->get(),
            'blockedUsers' => UserResource::collection($user->blockedUsers()->with('profile')->get())->resolve($request),
            'mutedUsers' => UserResource::collection($user->mutedUsers()->with('profile')->get())->resolve($request),
        ]);
    }

    public function update(UpdateSettingsRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (array_key_exists('is_private', $validated)) {
            $user->update(['is_private' => $validated['is_private']]);
            unset($validated['is_private']);
        }

        $user->settings()->updateOrCreate(['user_id' => $user->id], $validated);

        return back()->with('success', 'Settings saved.');
    }

    public function changePassword(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return back()->with('success', 'Password changed successfully.');
    }

    public function deactivate(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);

        $user = $request->user();
        $user->update([
            'is_deactivated' => true,
            'deactivated_at' => now(),
        ]);

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('status', 'Your account has been deactivated. Log in anytime to reactivate.');
    }

    public function destroyAccount(Request $request): RedirectResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);

        $user = $request->user();
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $user->delete();

        return redirect()->route('login')->with('status', 'Your account has been permanently deleted.');
    }
}
