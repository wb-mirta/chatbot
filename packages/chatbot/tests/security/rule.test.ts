import { createRule } from '#security/rule';

describe('Security: Rule', () => {

  describe('createRule', () => {

    it('should create rule with single userId', () => {

      const rule = createRule('allow', r => r.userId('123'));

      expect(rule).toHaveProperty('userId');
      expect(rule.userId).toHaveProperty('123', true);

    });

    it('should create rule with multiple userIds', () => {

      const rule = createRule('allow', r => r.userId('1', '2', '3'));

      expect(rule.userId).toHaveProperty('1', true);
      expect(rule.userId).toHaveProperty('2', true);
      expect(rule.userId).toHaveProperty('3', true);

    });

    it('should create rule with username', () => {

      const rule = createRule('allow', r => r.username('john_doe'));

      expect(rule).toHaveProperty('username');
      expect(rule.username).toHaveProperty('john_doe', true);

    });

    it('should create rule with chatId', () => {

      const rule = createRule('allow', r => r.chatId('999'));

      expect(rule).toHaveProperty('chatId');
      expect(rule.chatId).toHaveProperty('999', true);

    });

    it('should create rule with chatType', () => {

      const rule = createRule('allow', r => r.chatType('private', 'group'));

      expect(rule.chatType).toHaveProperty('private', true);
      expect(rule.chatType).toHaveProperty('group', true);

    });

    it('should support chaining multiple field setters', () => {

      const rule = createRule('allow', r => r
        .userId('123')
        .chatType('private')
        .username('admin')
      );

      expect(rule).toHaveProperty('userId');
      expect(rule).toHaveProperty('chatType');
      expect(rule).toHaveProperty('username');

    });

    it('should create deny rule with correct structure', () => {

      const rule = createRule('deny', r => r.userId('blocked'));

      expect(rule).toHaveProperty('userId');
      expect(rule.userId).toHaveProperty('blocked', false);

    });

    it('should handle multiple values in different fields', () => {

      const rule = createRule('allow', (r) => {

        r.userId('1', '2');
        r.chatId('10', '20', '30');

      });

      expect(Object.keys(rule.userId ?? {})).toHaveLength(2);
      expect(Object.keys(rule.chatId ?? {})).toHaveLength(3);

    });

  });

});
