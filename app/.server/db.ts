import { Prisma, PrismaClient } from "@prisma/client";

export const selectUser = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
});

export type User = Prisma.UserGetPayload<{ select: typeof selectUser }>;

export const findUserById = async (
  prisma: PrismaClient,
  id: string
): Promise<User | null> => {
  return prisma.user.findUnique({
    select: selectUser,
    where: { id },
  });
};

export interface upsertUserData {
  name: string;
  googleAccountId: string;
}

export const upsertUser = async (
  prisma: PrismaClient,
  { name, googleAccountId }: upsertUserData
): Promise<User> => {
  const { user } = await prisma.googleAccount.upsert({
    where: { id: googleAccountId },
    update: {},
    create: {
      id: googleAccountId,
      user: {
        create: {
          name,
        },
      },
    },
    select: { user: { select: selectUser } },
  });

  return user;
};
