'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/use-auth';
import { errorMessage } from '@/lib/api-errors';
import { loginFormSchema, returnPathSchema } from '@/lib/validation/auth.schema';
import type { LoginFormValues } from '@/lib/validation/auth.schema';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLogin();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors } = form.formState;

  function handleSubmit(values: LoginFormValues) {
    loginMutation.mutate(values, {
      onSuccess: () => {
        router.replace(returnPathSchema.parse(searchParams.get('next') ?? undefined));
      },
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Use your email address and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldGroup>
            {loginMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage(loginMutation.error)}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={errors.email !== undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={errors.email !== undefined}
                {...form.register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field data-invalid={errors.password !== undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password !== undefined}
                {...form.register('password')}
              />
              <FieldError errors={[errors.password]} />
            </Field>
            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Logging in...' : 'Log in'}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
