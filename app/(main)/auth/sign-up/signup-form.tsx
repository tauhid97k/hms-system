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
import { signUpSchema, SignUpSchemaType } from "@/schema/authSchema";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

const SignUpForm = () => {
  const [pendingAuth] = useState<boolean>(false);
  const [formError] = useState<string>("");

  const form = useForm({
    resolver: yupResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      organizationName: "",
      password: "",
    },
  });

  // On Submit
  const onSubmit = async (values: SignUpSchemaType) => {
    console.log(values);
  };

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription className="text-center">
          Create an account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
          <FieldSet>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <Input {...field} id="name" placeholder="John Doe" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
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
                name="organizationName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="organizationName">
                      Organization Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="organizationName"
                      placeholder="acme inc"
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
                Sign Up
              </Button>
            </FieldGroup>
          </FieldSet>
        </form>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1 text-center text-sm">
          <span className="text-muted-foreground">
            Already have an account?
          </span>
          <Link
            href="/auth/sign-in"
            className="underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-hidden"
          >
            Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignUpForm;
