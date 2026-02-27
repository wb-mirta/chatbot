/**
 * Функция, вычисляющая задержку (в миллисекундах) на основе количества попыток.
 *
 * Используется в механизмах повторных попыток (retry) для увеличения интервала с каждым шагом.
 *
 * @since 0.4.8
 *
 **/
type BackoffFunction = (attempts: number) => number;

/**
 * Параметры настройки экспоненциальной задержки.
 *
 * @since 0.4.8
 *
 **/
interface ExponentialBackoffOptions {

  /**
   * Начальная задержка в миллисекундах.
   *
   **/
  delay: number;

  /**
   * Максимальное количество попыток перед установкой постоянного интервала.
   *
   **/
  maxAttempts: number;

}

/**
 * Создаёт функцию экспоненциальной задержки.
 *
 * После достижения `maxAttempts` задержка стабилизируется и больше не растёт.
 *
 * Используется для повышения устойчивости системы при сбоях:
 * - Опрос обновлений
 * - Отправка сообщений
 * - Восстановление после временных ошибок сети
 *
 * @param options - Параметры экспоненциальной задержки
 * @returns Функция, принимающая количество попыток и возвращающая задержку в мс
 *
 * @example
 * ```ts
 * const backoff = createExponentialBackoff({ delay: 1000, maxAttempts: 6 });
 *
 * log(backoff(0)); // 1000
 * log(backoff(1)); // 2000
 * log(backoff(2)); // 4000
 * log(backoff(6)); // 64000
 * log(backoff(10)); // 64000 (ограничено maxAttempts)
 * ```
 * @since 0.4.8
 *
 **/
export function createExponentialBackoff(options: ExponentialBackoffOptions): BackoffFunction {

  const { delay, maxAttempts } = options;

  return (attempts: number): number => {

    attempts = Math.max(0, Math.floor(attempts));

    // Ограничиваем количество попыток, чтобы задержка не росла бесконечно
    if (attempts > maxAttempts)
      attempts = maxAttempts;

    // Рассчитываем экспоненциальную задержку
    return Math.pow(2, attempts) * delay;

  };

}
