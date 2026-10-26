export const getPasswordRequirements = (
  password: string,
  confirmPassword?: string,
) => [
  { label: "At least 8 characters", test: () => password.length >= 8 },
  { label: "One lowercase letter", test: () => /[a-z]/.test(password) },
  { label: "One uppercase letter", test: () => /[A-Z]/.test(password) },
  { label: "At least one number", test: () => /[0-9]/.test(password) },
  {
    label: "One special symbol (!@#$...)",
    test: () => /[^A-Za-z0-9]/.test(password),
  },
  {
    label: "Passwords match",
    test: () =>
      confirmPassword !== undefined
        ? password === confirmPassword && password !== ""
        : true,
  },
];

export const isPasswordValid = (password: string, confirmPassword?: string) => {
  return getPasswordRequirements(password, confirmPassword).every((req) =>
    req.test(),
  );
};
