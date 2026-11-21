<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\LoginActivity;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login', [
            'status' => session('status'),
        ]);
    }

    public function login(LoginRequest $request): RedirectResponse
    {
        $loginField = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $user = User::where($loginField, $request->login)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return back()->withErrors([
                'login' => 'The provided credentials do not match our records.',
            ])->onlyInput('login');
        }

        if ($user->is_suspended) {
            return back()->withErrors([
                'login' => 'Your account has been suspended. Please contact support.',
            ]);
        }

        if ($user->is_deactivated) {
            $user->update([
                'is_deactivated' => false,
                'deactivated_at' => null,
            ]);
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        LoginActivity::where('user_id', $user->id)->update(['is_current' => false]);
        LoginActivity::create([
            'user_id' => $user->id,
            'session_id' => $request->session()->getId(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device' => $this->parseDevice($request->userAgent()),
            'logged_in_at' => now(),
            'is_current' => true,
        ]);

        $user->forceFill(['last_seen_at' => now()])->saveQuietly();

        return redirect()->intended(route('home'));
    }

    public function showRegister(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function register(RegisterRequest $request): RedirectResponse
    {
        if (! PlatformSetting::getValue('registration_enabled', true)) {
            return back()->withErrors(['email' => 'New registrations are currently disabled.']);
        }

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'username' => strtolower($request->username),
                'email' => strtolower($request->email),
                'password' => $request->password,
                'last_seen_at' => now(),
            ]);

            $user->profile()->create();
            $user->settings()->create();

            return $user;
        });

        event(new Registered($user));
        Auth::login($user);

        LoginActivity::create([
            'user_id' => $user->id,
            'session_id' => $request->session()->getId(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device' => $this->parseDevice($request->userAgent()),
            'logged_in_at' => now(),
            'is_current' => true,
        ]);

        return redirect()->route('home')->with('success', 'Welcome to Pulse!');
    }

    public function logout(Request $request): RedirectResponse
    {
        if ($request->user()) {
            LoginActivity::where('user_id', $request->user()->id)
                ->where('session_id', $request->session()->getId())
                ->update(['is_current' => false]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    public function checkUsername(Request $request): JsonResponse
    {
        $username = strtolower((string) $request->query('username', ''));
        $valid = (bool) preg_match('/^[a-zA-Z0-9_]{3,30}$/', $username);
        $available = $valid && ! User::where('username', $username)->exists();

        return response()->json([
            'available' => $available,
            'valid' => $valid,
        ]);
    }

    public function showForgotPassword(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    public function sendResetLink(Request $request): RedirectResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::sendResetLink($request->only('email'));

        return $status === Password::RESET_LINK_SENT
            ? back()->with('status', __($status))
            : back()->withErrors(['email' => __($status)]);
    }

    public function showResetPassword(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $request->query('email', ''),
        ]);
    }

    public function resetPassword(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => $password])->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? redirect()->route('login')->with('status', __($status))
            : back()->withErrors(['email' => __($status)]);
    }

    public function verifyEmailNotice(Request $request): Response|RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->route('home');
        }

        return Inertia::render('Auth/VerifyEmail', [
            'status' => session('status'),
        ]);
    }

    public function verifyEmail(EmailVerificationRequest $request): RedirectResponse
    {
        $request->fulfill();

        return redirect()->route('home')->with('success', 'Email verified successfully!');
    }

    public function resendVerification(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->route('home');
        }

        $request->user()->sendEmailVerificationNotification();

        return back()->with('status', 'Verification link sent!');
    }

    private function parseDevice(?string $ua): string
    {
        if (! $ua) {
            return 'Unknown Device';
        }
        if (str_contains($ua, 'Mobile')) {
            return 'Mobile Browser';
        }
        if (str_contains($ua, 'Windows')) {
            return 'Windows PC';
        }
        if (str_contains($ua, 'Mac')) {
            return 'Mac';
        }
        if (str_contains($ua, 'Linux')) {
            return 'Linux PC';
        }

        return 'Web Browser';
    }
}
