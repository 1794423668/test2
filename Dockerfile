# Version 0.1

# 基础镜像
FROM registry.ispacesys.cn/pm2/restbase:7-centos

# 维护者信息
MAINTAINER 1794423668@qq.com

# 镜像操作命令
RUN apt-get -yqq update && apt-get install -yqq apache2 && apt-get clean

# 容器启动命令
CMD ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]

EXPOSE 80