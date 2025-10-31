"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { SignInSchemaType, signInSchema } from "@/schema/authSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

const SignInForm = () => {
  const [pendingAuth] = useState<boolean>(false);
  const [formError] = useState<string>("");

  const form = useForm({
    resolver: yupResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // On Submit
  const onSubmit = async (values: SignInSchemaType) => {
    console.log(values);
  };

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription className="text-center">
          Enter your account details to login
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldSet>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      placeholder="john@example.com"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input {...field} id="password" placeholder="password" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <FormError message={formError} />
              <Button
                type="submit"
                className="mt-4 w-full"
                isLoading={pendingAuth}
              >
                Sign In
              </Button>
            </FieldGroup>
          </FieldSet>
        </form>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1 text-center text-sm">
          <span className="text-muted-foreground">
            Don&apos;t have an account?
          </span>
          <Link
            href="/auth/sign-up"
            className="underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-hidden"
          >
            Sign Up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignInForm;
