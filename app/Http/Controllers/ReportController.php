<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:post,user'],
            'id' => ['required', 'integer'],
            'reason' => ['required', 'string', 'max:100'],
            'details' => ['nullable', 'string', 'max:1000'],
        ]);

        $modelClass = $validated['type'] === 'post' ? Post::class : User::class;
        $target = $modelClass::findOrFail($validated['id']);

        Report::create([
            'reporter_id' => $request->user()->id,
            'reportable_type' => $modelClass,
            'reportable_id' => $target->id,
            'reason' => $validated['reason'],
            'details' => $validated['details'] ?? null,
        ]);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['reported' => true], 201);
        }

        return back()->with('success', 'Thank you. Your report has been submitted for review.');
    }
}
