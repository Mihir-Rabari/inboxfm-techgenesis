import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { BriefingStyle } from "@prisma/client";

@Injectable()
export class StylesService {
  constructor(private readonly prisma: PrismaService) {}

  async getStyles(userId: string): Promise<BriefingStyle[]> {
    return this.prisma.briefingStyle.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getStyle(userId: string, id: string): Promise<BriefingStyle> {
    const style = await this.prisma.briefingStyle.findFirst({
      where: { id, userId },
    });
    if (!style) {
      throw new NotFoundException("Briefing style not found");
    }
    return style;
  }

  async createStyle(
    userId: string,
    data: { name: string; description?: string; prompt: string; isDefault?: boolean },
  ): Promise<BriefingStyle> {
    if (!data.name || !data.prompt) {
      throw new BadRequestException("Name and prompt are required");
    }

    // If setting as default, unset others first
    if (data.isDefault) {
      await this.prisma.briefingStyle.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Check if it is the first style for this user, if so, force default
    const count = await this.prisma.briefingStyle.count({ where: { userId } });
    const isDefault = count === 0 ? true : !!data.isDefault;

    return this.prisma.briefingStyle.create({
      data: {
        userId,
        name: data.name,
        description: data.description || null,
        prompt: data.prompt,
        isDefault,
      },
    });
  }

  async updateStyle(
    userId: string,
    id: string,
    data: { name?: string; description?: string; prompt?: string; isDefault?: boolean },
  ): Promise<BriefingStyle> {
    const style = await this.getStyle(userId, id);

    if (data.isDefault) {
      await this.prisma.briefingStyle.updateMany({
        where: { userId, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.briefingStyle.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.prompt !== undefined && { prompt: data.prompt }),
        ...(data.isDefault !== undefined && { isDefault: !!data.isDefault }),
      },
    });
  }

  async setDefault(userId: string, id: string): Promise<BriefingStyle> {
    await this.getStyle(userId, id);

    await this.prisma.briefingStyle.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return this.prisma.briefingStyle.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async deleteStyle(userId: string, id: string): Promise<{ success: boolean }> {
    const style = await this.getStyle(userId, id);

    if (style.isDefault) {
      const otherStyles = await this.prisma.briefingStyle.findFirst({
        where: { userId, NOT: { id } },
      });
      if (otherStyles) {
        // Set another style as default before deleting
        await this.prisma.briefingStyle.update({
          where: { id: otherStyles.id },
          data: { isDefault: true },
        });
      }
    }

    await this.prisma.briefingStyle.delete({
      where: { id },
    });

    return { success: true };
  }
}
