import { createPolicy } from '#security/policy';

describe('Security: Policy', () => {

  describe('createPolicy', () => {

    it('should create empty rule config array when no rules defined', () => {

      const rules = createPolicy(p => p);

      expect(Array.isArray(rules)).toBe(true);
      expect(rules).toHaveLength(0);

    });

    it('should create allow rule with userId', () => {

      const rules = createPolicy(p => p
        .allow(r => r.userId('123'))
      );

      expect(rules).toHaveLength(1);
      expect(rules[0]).toHaveProperty('userId');
      expect(rules[0].userId).toHaveProperty('123');

    });

    it('should create deny rule with username', () => {

      const rules = createPolicy(p => p
        .deny(r => r
          .username('blocked_user')
        )
      );

      expect(rules).toHaveLength(1);
      expect(rules[0]).toHaveProperty('username');
      expect(rules[0].username).toHaveProperty('blocked_user');

    });

    it('should support chaining multiple allow rules', () => {

      const rules = createPolicy(p => p
        .allow(r => r.userId('123'))
        .allow(r => r.chatType('private'))
      );

      expect(rules).toHaveLength(2);

    });

    it('should support mixing allow and deny rules', () => {

      const rules = createPolicy(p => p
        .allow(r => r.chatId('100'))
        .deny(r => r.userId('999'))
        .allow(r => r.username('admin'))
      );

      expect(rules).toHaveLength(3);

    });

    it('should handle complex rule combinations', () => {

      const rules = createPolicy(p => p
        .allow((r) => {

          r.userId('1', '2', '3');
          r.chatType('private', 'group');

        })
        .deny(r => r.username('banned'))
      );

      expect(rules.length).toBeGreaterThan(0);
      const allowRule = rules.find(r => r.userId);
      const denyRule = rules.find(r => r.username);

      expect(allowRule).toBeDefined();
      expect(denyRule).toBeDefined();

    });

  });

});
