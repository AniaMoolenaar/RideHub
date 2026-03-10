const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getAppName = () => {
  if (IS_DEV) return "RideHub Dev";
  return "RideHub";
};

const getAndroidPackage = () => {
  if (IS_DEV) return "com.anonymous.ridehub.dev";
  if (IS_PREVIEW) return "com.anonymous.ridehub";
  return "com.anonymous.ridehub";
};

const getIosBundleIdentifier = () => {
  if (IS_DEV) return "com.anonymous.ridehub.dev";
  if (IS_PREVIEW) return "com.anonymous.ridehub";
  return "com.anonymous.ridehub";
};

export default ({ config }) => ({
  ...config,
  name: getAppName(),
  ios: {
    ...config.ios,
    bundleIdentifier: getIosBundleIdentifier(),
  },
  android: {
    ...config.android,
    package: getAndroidPackage(),
  },
  extra: {
    ...config.extra,
    eas: {
      projectId: "d43c30cd-c7c8-48d6-b9f7-69c433dc7aa4",
    },
  },
});