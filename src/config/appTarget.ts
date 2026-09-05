export type AppTargetMode = 'ADMIN' | 'STAFF' | 'ALL';

export const getAppTargetMode = (): AppTargetMode => {
  const envTarget = import.meta.env.VITE_APP_TARGET as string;
  if (envTarget === 'ADMIN' || envTarget === 'STAFF') {
    return envTarget;
  }
  const localTarget = localStorage.getItem('app_target_mode');
  if (localTarget === 'ADMIN' || localTarget === 'STAFF') {
    return localTarget;
  }
  return 'ALL';
};

export const setAppTargetMode = (mode: AppTargetMode) => {
  localStorage.setItem('app_target_mode', mode);
};
