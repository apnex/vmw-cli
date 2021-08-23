FROM alpine AS build
LABEL stage=intermediate
WORKDIR "/root"
RUN	apk --no-cache add \
	git \
	nodejs \
	npm \
	&& npm install npm@latest --global \
	&& npm install vmw-cli

FROM alpine
COPY --from=build /root/node_modules /root/node_modules
RUN	apk --no-cache add nodejs \
	&& ln -s /root/node_modules/vmw-cli/lib/vmw.cli.js /usr/bin/vmw-cli \
	&& mkdir -p /files /state
COPY vmw-cli /root/
COPY vmw.complete /root/
COPY start.sh /root/
ENV VMWFILESDIR "/files"
ENV VMWSTATEDIR "/state"
ENTRYPOINT ["/root/start.sh"]
