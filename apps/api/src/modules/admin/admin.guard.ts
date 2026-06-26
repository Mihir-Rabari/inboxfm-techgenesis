import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.id) {
            throw new ForbiddenException('Authentication required');
        }

        // Check if user is admin
        const admin = await this.prisma.admin.findUnique({
            where: { userId: user.id },
        });

        if (!admin) {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}
