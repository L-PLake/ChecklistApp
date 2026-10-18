export const DEFAULT_ICON = '📋';
export const LIST_ICONS = ['📋', '✈️', '🎒', '🧳', '🏕️', '🏠', '🛒', '🍽️', '⭐', '🎯', '📚', '💼'];
export const MAX_TASKS_PER_LIST = 200;
export const MAX_SNAPSHOT_URL_LENGTH = 8000;
export const MAX_BACKUP_BYTES = 32 * 1024 * 1024;

const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{16,40}$/;

export const normalizeList = (list, index, maxTasks = Infinity) => {
  if (!list || typeof list !== 'object' || Array.isArray(list)) throw new Error('Invalid checklist');
  if (list.title !== undefined && (typeof list.title !== 'string' || list.title.length > 80)) {
    throw new Error('Checklist names must be 80 characters or fewer.');
  }
  if (list.notes !== undefined && (typeof list.notes !== 'string' || list.notes.length > 4000)) {
    throw new Error('Checklist notes must be 4,000 characters or fewer.');
  }

  const rawTasks = list.tasks === undefined ? [] : list.tasks;
  const tasks = Array.isArray(rawTasks)
    ? rawTasks
    : rawTasks && typeof rawTasks === 'object'
      ? Object.values(rawTasks)
      : null;
  if (!tasks) throw new Error('Checklist items must be a list.');
  if (tasks.length > maxTasks) {
    throw new Error(`Each shared checklist can contain up to ${maxTasks} items.`);
  }

  const normalizedTasks = tasks.map(task => {
    if (!task || typeof task !== 'object' || Array.isArray(task)) throw new Error('Invalid checklist item.');
    if (task.text !== undefined && (typeof task.text !== 'string' || task.text.length > 240)) {
      throw new Error('Checklist items must be 240 characters or fewer.');
    }
    if (task.done !== undefined && typeof task.done !== 'boolean') {
      throw new Error('Checklist completion status must be true or false.');
    }
    if (task.id !== undefined && (typeof task.id !== 'string' || task.id.length > 80)) {
      throw new Error('Invalid checklist item identifier.');
    }
    return {
      id: typeof task.id === 'string' && task.id ? task.id : globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: task.text || '',
      done: !!task.done
    };
  }).filter(task => task.text);
  if (new Set(normalizedTasks.map(task => task.id)).size !== normalizedTasks.length) {
    throw new Error('Checklist item identifiers must be unique.');
  }

  if (list.id !== undefined && (typeof list.id !== 'string' || !list.id || list.id.length > 80)) {
    throw new Error('Invalid checklist identifier.');
  }

  return {
    id: list.id || `list-${index}-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
    sharedId: typeof list.sharedId === 'string' && SHARE_ID_PATTERN.test(list.sharedId) ? list.sharedId : '',
    title: list.title || 'My list',
    icon: LIST_ICONS.includes(list.icon) ? list.icon : DEFAULT_ICON,
    tasks: normalizedTasks,
    notes: list.notes || ''
  };
};

export const normalizeState = (data, {maxTasksPerList = Infinity} = {}) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid checklist backup.');
  if (Array.isArray(data.lists)) {
    if (!data.lists.length) throw new Error('A backup must contain at least one checklist.');
    const lists = data.lists.map((list, index) => normalizeList(list, index, maxTasksPerList));
    if (new Set(lists.map(list => list.id)).size !== lists.length) {
      throw new Error('Checklist identifiers must be unique.');
    }
    return {lists, activeListId: lists.some(list => list.id === data.activeListId) ? data.activeListId : lists[0].id};
  }
  if (Array.isArray(data.tasks)) {
    const list = normalizeList(data, 0, maxTasksPerList);
    return {lists: [list], activeListId: list.id};
  }
  throw new Error('Invalid checklist backup.');
};

export const decodeSnapshot = encoded => {
  if (typeof encoded !== 'string' || encoded.length > MAX_SNAPSHOT_URL_LENGTH
    || !/^[A-Za-z0-9_-]*$/.test(encoded) || encoded.length % 4 === 1) {
    throw new Error('Invalid or oversized snapshot link.');
  }
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(
    atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')),
    character => character.charCodeAt(0)
  );
  return normalizeState(JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)));
};

export const encodeSnapshotUrl = (currentUrl, state, lists) => {
  if (!Array.isArray(lists) || !lists.length) throw new Error('There are no checklists to share.');
  const sharedLists = lists.map(list => ({...list, sharedId: ''}));
  const snapshot = {
    ...state,
    lists: sharedLists,
    activeListId: sharedLists.some(list => list.id === state.activeListId)
      ? state.activeListId
      : sharedLists[0].id
  };
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  if (encoded.length > MAX_SNAPSHOT_URL_LENGTH) {
    throw new Error('This snapshot is too large for a share link. Export a backup instead.');
  }
  const url = new URL(currentUrl);
  url.searchParams.delete('live');
  url.hash = `share=${encoded}`;
  return url.href;
};
