<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DbBackup extends Command
{
    protected $signature = 'db:backup';

    protected $description = 'Gera backup do banco PostgreSQL em storage/app/backups/';

    public function handle(): int
    {
        $host     = env('DB_HOST', '127.0.0.1');
        $port     = env('DB_PORT', '5432');
        $database = env('DB_DATABASE');
        $username = env('DB_USERNAME');
        $password = env('DB_PASSWORD');

        if (! $database || ! $username) {
            $this->error("DB_DATABASE ou DB_USERNAME não configurados no .env.");
            return self::FAILURE;
        }

        $backupDir = storage_path('app/backups');
        if (! is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $timestamp = now()->format('Y-m-d_H-i-s');
        $baseName  = "backup_{$database}_{$timestamp}";
        $sqlFile   = "{$backupDir}/{$baseName}.sql";

        $this->info("Iniciando backup de '{$database}'...");

        // pg_dump — compatível com Windows e Linux/Mac
        $isWindows = PHP_OS_FAMILY === 'Windows';
        $pgDump    = $isWindows
            ? 'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe'
            : 'pg_dump';

        if ($isWindows) {
            $cmd = sprintf(
                '%s -h %s -p %s -U %s -d %s -F p -f %s',
                escapeshellarg($pgDump),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($database),
                escapeshellarg($sqlFile)
            );

            $descriptors = [
                0 => ['pipe', 'r'],
                1 => ['pipe', 'w'],
                2 => ['pipe', 'w'],
            ];

            $env = array_merge(getenv(), ['PGPASSWORD' => $password]);
        } else {
            $cmd = sprintf(
                'PGPASSWORD=%s %s -h %s -p %s -U %s -d %s -F p -f %s',
                escapeshellarg($password),
                escapeshellarg($pgDump),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($database),
                escapeshellarg($sqlFile)
            );

            $descriptors = [
                0 => ['pipe', 'r'],
                1 => ['pipe', 'w'],
                2 => ['pipe', 'w'],
            ];

            $env = null;
        }

        $process = proc_open($cmd, $descriptors, $pipes, null, $env);

        if (! is_resource($process)) {
            $this->error("Falha ao iniciar pg_dump.");
            return self::FAILURE;
        }

        fclose($pipes[0]);

        $start = time();
        while (true) {
            $status = proc_get_status($process);
            if (! $status['running']) break;
            $elapsed = time() - $start;
            echo "\r  Aguardando pg_dump... {$elapsed}s";
            sleep(1);
        }
        echo "\n";

        $stderr   = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);

        if ($exitCode !== 0) {
            $this->error("pg_dump falhou (exit {$exitCode}): {$stderr}");
            return self::FAILURE;
        }

        if (! file_exists($sqlFile)) {
            $this->error("Arquivo .sql não encontrado após pg_dump.");
            return self::FAILURE;
        }

        $sizeBytes = filesize($sqlFile);
        $sizeMb    = round($sizeBytes / 1024 / 1024, 2);

        $this->info("Backup gerado com sucesso:");
        $this->line("  Arquivo : {$sqlFile}");
        $this->line("  Tamanho : {$sizeMb} MB ({$sizeBytes} bytes)");

        return self::SUCCESS;
    }
}
