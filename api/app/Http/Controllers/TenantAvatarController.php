<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class TenantAvatarController extends Controller
{
    public function store(Request $request, int $tenantId)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:5120'],
        ]);

        $tenant = Tenant::findOrFail($tenantId);
        $base   = "tenants/{$tenantId}/logo";

        if ($tenant->logo_path) {
            Storage::disk('public')->deleteDirectory($tenant->logo_path);
        }

        $manager = new ImageManager(new Driver());

        $img = $manager->read($request->file('avatar')->getRealPath());
        $img->scaleDown(800, 800);
        Storage::disk('public')->put("{$base}/original.jpg", $img->toJpeg(85)->toString());

        $img->scaleDown(400, 400);
        Storage::disk('public')->put("{$base}/md.jpg", $img->toJpeg(80)->toString());

        $img->scaleDown(150, 150);
        Storage::disk('public')->put("{$base}/sm.jpg", $img->toJpeg(75)->toString());

        $tenant->update(['logo_path' => $base]);

        return response()->json(static::logoUrls($base));
    }

    public function destroy(int $tenantId)
    {
        $tenant = Tenant::findOrFail($tenantId);

        if ($tenant->logo_path) {
            Storage::disk('public')->deleteDirectory($tenant->logo_path);
            $tenant->update(['logo_path' => null]);
        }

        return response()->json(null, 204);
    }

    public static function logoUrls(?string $logoPath): array
    {
        if (!$logoPath) {
            return ['logo_original' => null, 'logo_md' => null, 'logo_sm' => null];
        }

        $base = asset("storage/{$logoPath}");

        return [
            'logo_original' => "{$base}/original.jpg",
            'logo_md'       => "{$base}/md.jpg",
            'logo_sm'       => "{$base}/sm.jpg",
        ];
    }
}
