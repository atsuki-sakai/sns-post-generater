# Cloudflare Workers最適化

## 制約整理
- **CPU時間**: デフォルト10ms、上限最大30秒。重い画像生成は外部API + Queueで処理。
- **メモリ**: 128MB。大規模プロンプトや画像バイナリを保持しない（R2経由でストリーム）。
- **リクエスト制限**: 同時接続数やMeta APIレート制限に留意。
- **モジュールワーカー**: ES Modules形式でバンドル。トップレベル副作用を避け、遅延初期化。

## 初期化パターン
```ts
class LazyAIClient {
  private instance?: ChatOpenAI;

  constructor(private readonly env: Env) {}

  get model() {
    if (!this.instance) {
      this.instance = new ChatOpenAI({
        openAIApiKey: this.env.OPENAI_API_KEY,
        modelName: this.env.OPENAI_MODEL ?? "gpt-5-mini",
        temperature: 0.7,
      });
    }
    return this.instance;
  }
}
```
- 初回アクセス時のみモデルを生成し、コールドスタートコストを最小化。

## バッチ処理
```ts
export async function processBatch<T, R>(
  items: readonly T[],
  processor: (item: T) => Promise<R>,
  batchSize = 5
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}
```
- Queueコンシューマで利用し、外部APIへの同時接続数を制御。

## キャッシュ・再利用
- `SmartCache` でプロンプト・ペルソナ定義をKVにキャッシュ。
- Cloudflare Cache APIを使い、静的データ（ブランドガイドライン等）を短時間キャッシュ。
- モジュールスコープで再利用可能なオブジェクト（Zodスキーマ、ルータ）を定義し、リクエスト毎の再生成を避ける。

## Bundling戦略
- `wrangler.toml` の `main` を `src/worker/index.ts` に設定し、ESBuildでツリーシェイキング。
- `module-graph` を可視化し、不要な依存を排除（例: Node.js専用パッケージ禁止）。
- 画像生成SDK等が重い場合は分離し、`Service Worker` (Queue Consumer) として別ワーカーに。

## Queue & Cron
- Queueはバッチ処理を利用するとCPU時間を節約できる。`batch.messages` をforループで処理。
- Cron Triggerは軽量関数でQueueへ再委譲し、長時間処理を避ける。

## エラーリトライ
- Cloudflare Queueの再試行メカニズムを利用しつつ、アプリ側でも指数バックオフを実装。
- `Meta API` はレート制限時に `Retry-After` を返すため、Queueメッセージにディレイを設定。

## ミドルウェア最適化
- 認証やレート制限はKVを利用してO(1)アクセス。
- 不要なログ出力を排除し、Analytics Engineに集約。
- `errorHandler` は最小限のスタックトレースのみ保存し、レスポンスは簡潔に。

## ローカル開発
- `Miniflare` を活用し、Queue・KV・R2・D1をエミュレート。`--modules` オプションを忘れずに。
- `npm run dev` でVite + Wranglerを並行起動。`wrangler dev --local` で高速反復。

## デプロイベストプラクティス
- `npm run check` でTypeScriptビルド、ESLint、Wrangler dry-runを実行。
- GitHub Actionsで `wrangler deploy --env production`。Secretsは環境毎に設定。
- `wrangler kv:key list` などの管理コマンドは本番で直接実行せず、運用ツールを通す。
