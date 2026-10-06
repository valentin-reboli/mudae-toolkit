export async function runWithConcurrency(items, limit, worker, { isCancelled = () => false } = {}) {
  const queue = [...items];
  const next = async () => {
    while (queue.length && !isCancelled()) {
      await worker(queue.shift());
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, queue.length) }, next));
}
