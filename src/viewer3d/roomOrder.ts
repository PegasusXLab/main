// Previous / Next room order for the viewer (ADR-007, Q8): breadth-first from the entrance through
// doorways, neighbors in document order, rooms not connected to the entrance appended last.
// Pure data: reads only the SceneModel.

import type { SceneModel } from "@/lib/compile/types";

export function roomOrder(
  scene: Pick<SceneModel, "rooms" | "doorways">,
  entranceRoomId: string,
): string[] {
  const docOrder = scene.rooms.map((r) => r.roomId);
  const rank = new Map(docOrder.map((id, i) => [id, i]));
  const neighbors = new Map<string, string[]>(docOrder.map((id) => [id, []]));
  for (const {
    roomIds: [a, b],
  } of scene.doorways) {
    neighbors.get(a)?.push(b);
    neighbors.get(b)?.push(a);
  }
  for (const list of neighbors.values())
    list.sort((p, q) => rank.get(p)! - rank.get(q)!);

  const order: string[] = [];
  const seen = new Set<string>();
  const queue = rank.has(entranceRoomId) ? [entranceRoomId] : [];
  seen.add(entranceRoomId);
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const n of neighbors.get(id) ?? []) {
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  for (const id of docOrder) if (!seen.has(id)) order.push(id);
  return order;
}
