<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class TseImportFotos extends Command
{
    protected $signature = 'tse:import-fotos {uf} {ano}';

    protected $description = 'Baixa e extrai fotos de candidatos do TSE para storage/app/fotos/';

    public function handle(): int
    {
        $uf  = strtoupper($this->argument('uf'));
        $ano = $this->argument('ano');

        $url     = "https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes{$ano}/fotos/foto_cand{$ano}_{$uf}_div.zip";
        $zipName = "foto_cand{$ano}_{$uf}.zip";
        $zipPath = storage_path("app/temp/{$zipName}");
        $destDir = storage_path('app/fotos');

        // Garante que os diretórios existem
        if (! is_dir(dirname($zipPath))) {
            mkdir(dirname($zipPath), 0755, true);
        }
        if (! is_dir($destDir)) {
            mkdir($destDir, 0755, true);
        }

        // Download via stream
        $this->info("Baixando: {$url}");

        $response = Http::timeout(0)->sink($zipPath)->get($url);

        if (! $response->successful()) {
            $this->error("Falha no download. HTTP {$response->status()}");
            return self::FAILURE;
        }

        $sizeMb = round(filesize($zipPath) / 1024 / 1024, 1);
        $this->info("ZIP salvo: {$zipPath} ({$sizeMb} MB)");

        // Extração
        $zip = new ZipArchive();
        $result = $zip->open($zipPath);

        if ($result !== true) {
            $this->error("Não foi possível abrir o ZIP. Código: {$result}");
            return self::FAILURE;
        }

        $total = $zip->count();
        $this->info("Extraindo {$total} arquivos para {$destDir}...");

        $zip->extractTo($destDir);
        $zip->close();

        // Remove o ZIP temp
        unlink($zipPath);

        $this->info("Concluído: {$total} arquivos extraídos. ZIP temp removido.");

        return self::SUCCESS;
    }
}
