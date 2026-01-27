declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_TELEGRAM_TOKEN: string
      APP_TELEGRAM_USER: string
    }
  }
}

export { }
