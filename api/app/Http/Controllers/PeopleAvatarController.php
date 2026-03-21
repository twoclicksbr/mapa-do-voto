<?php

namespace App\Http\Controllers;

use App\Models\People;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class PeopleAvatarController extends Controller
{
    /**
     * Upload avatar — scaling progressivo (lê disco uma vez, reduz em cascata):
     *   original.jpg  → max 800px, quality 85
     *   md.jpg        → max 400px, quality 80  (a partir do original já reduzido)
     *   sm.jpg        → max 150px, quality 75  (a partir do md já reduzido)
     */
    public function store(Request $request, int $personId)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:5120'], // 5 MB
        ]);

        $person = People::findOrFail($personId);
        $tenant = Tenant::findOrFail($person->tenant_id);
        $slug   = $tenant->slug;
        $base   = "{$slug}/avatar/{$personId}";

        // Apaga versões anteriores se existirem
        if ($person->photo_path) {
            Storage::disk('public')->deleteDirectory($person->photo_path);
        }

        $manager = new ImageManager(new Driver());

        // Scaling progressivo: cada versão parte da anterior (já menor)
        // original → md → sm, sem reler o disco

        $img = $manager->read($request->file('avatar')->getRealPath());
        $img->scaleDown(800, 800);
        Storage::disk('public')->put("{$base}/original.jpg", $img->toJpeg(85)->toString());

        $img->scaleDown(400, 400);
        Storage::disk('public')->put("{$base}/md.jpg", $img->toJpeg(80)->toString());

        $img->scaleDown(150, 150);
        Storage::disk('public')->put("{$base}/sm.jpg", $img->toJpeg(75)->toString());

        $person->update(['photo_path' => $base]);

        return response()->json($this->avatarUrls($base));
    }

    public function destroy(int $personId)
    {
        $person = People::findOrFail($personId);

        if ($person->photo_path) {
            Storage::disk('public')->deleteDirectory($person->photo_path);
            $person->update(['photo_path' => null]);
        }

        return response()->json(null, 204);
    }

    public static function avatarUrls(?string $photoPath): array
    {
        if (!$photoPath) {
            return ['photo_original' => null, 'photo_md' => null, 'photo_sm' => null];
        }

        $base = asset("storage/{$photoPath}");

        return [
            'photo_original' => "{$base}/original.jpg",
            'photo_md'       => "{$base}/md.jpg",
            'photo_sm'       => "{$base}/sm.jpg",
        ];
    }
}
