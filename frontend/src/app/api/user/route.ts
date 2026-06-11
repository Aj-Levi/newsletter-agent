import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";

// POST /api/user (Signup)
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 },
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: { name, email, passwordHash }
    })

    return NextResponse.json(
      { message: "Account created", userId: user.id },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

// PATCH /api/user (Edit Profile / Change Password)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};

    // 1. Update display name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    // 2. Update email
    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail === "") {
        return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 });
      }

      if (trimmedEmail !== user.email) {
        // Enforce email uniqueness
        const emailConflict = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });

        if (emailConflict) {
          return NextResponse.json({ error: "Email is already taken" }, { status: 409 });
        }
        updateData.email = trimmedEmail;
      }
    }

    // 3. Change password
    if (newPassword !== undefined) {
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters long" },
          { status: 400 }
        );
      }

      // If user has a password set, require verifying current password
      if (user.passwordHash) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required to change password" },
            { status: 400 }
          );
        }

        const isMatch = await compare(currentPassword, user.passwordHash);
        if (!isMatch) {
          return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
        }
      }

      // Hash and update password
      updateData.passwordHash = await hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes made" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/user (Delete Account)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete user from database (cascading constraints delete subscriptions/runs/sources automatically)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user account:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

