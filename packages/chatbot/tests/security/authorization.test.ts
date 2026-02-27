import { defineAuthorization } from '#security/authorization';

describe('Security: Authorization', () => {

  describe('defineAuthorization', () => {

    it('should create authorization builder with empty policies', () => {

      const auth = defineAuthorization(a => a);
      const policies = auth.build();

      expect(policies).toEqual({});

    });

    it('should add single policy via addPolicy', () => {

      const auth = defineAuthorization(a => a
        .addPolicy('admin', p => p
          .allow(r => r.userId('123'))
        )
      );
      const policies = auth.build();

      expect(policies).toHaveProperty('admin');
      expect(Array.isArray(policies.admin)).toBe(true);
      expect(policies.admin.length).toBeGreaterThan(0);

    });

    it('should add multiple policies with type safety', () => {

      const auth = defineAuthorization(a => a
        .addPolicy('admin', p => p
          .allow(r => r
            .userId('123'))
        )
        .addPolicy('user', p => p
          .allow(r => r
            .chatType('private'))
        )
      );
      const policies = auth.build();

      expect(policies).toHaveProperty('admin');
      expect(policies).toHaveProperty('user');
      expect(Object.keys(policies)).toHaveLength(2);

    });

    it('should support chaining addPolicy calls', () => {

      const auth = defineAuthorization((a) => {

        const step1 = a.addPolicy('first', p => p);
        const step2 = step1.addPolicy('second', p => p);
        return step2.addPolicy('third', p => p);

      });
      const policies = auth.build();

      expect(Object.keys(policies)).toEqual(['first', 'second', 'third']);

    });

    it('should build empty config when policy setup is empty', () => {

      const auth = defineAuthorization(a => a
        .addPolicy('empty', p => p)
      );
      const policies = auth.build();

      expect(policies.empty).toEqual([]);

    });

  });

});
