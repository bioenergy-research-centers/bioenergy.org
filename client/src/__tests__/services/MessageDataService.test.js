import { describe, it, expect, vi, beforeEach } from 'vitest';
import MessageDataService from '@/services/MessageDataService';
import http from '@/http-common';

vi.mock('@/http-common', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('MessageDataService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('create calls POST /messages/ with params', () => {
    const params = { contact_name: 'Alice', contact_email: 'alice@example.com' };
    MessageDataService.create(params);
    expect(http.post).toHaveBeenCalledWith('/messages/', params);
  });
});
