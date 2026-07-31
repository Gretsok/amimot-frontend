import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { emitAsync } from './socket';

const mockSocket = { emit: vi.fn() };
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('emitAsync timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSocket.emit.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects with code TIMEOUT if the server never acks', async () => {
    mockSocket.emit.mockImplementation(() => {}); // never calls the ack callback

    const promise = emitAsync('room:create', {});
    const assertion = expect(promise).rejects.toMatchObject({ code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
  });

  it('resolves normally when the server acks before the timeout', async () => {
    mockSocket.emit.mockImplementation((event, payload, cb) => cb({ ok: true, foo: 'bar' }));

    const result = await emitAsync('room:create', {});
    expect(result).toEqual({ ok: true, foo: 'bar' });
  });

  it('still rejects with the server error code when the ack reports failure', async () => {
    mockSocket.emit.mockImplementation((event, payload, cb) =>
      cb({ ok: false, error: 'ROOM_NOT_FOUND', message: 'Code invalide.' })
    );

    await expect(emitAsync('room:join', {})).rejects.toMatchObject({ code: 'ROOM_NOT_FOUND' });
  });
});
