FROM alpine
RUN	apk --no-cache add \
	git \
	nodejs \
	nodejs-npm \
	&& npm install npm@latest \
	&& npm install vmw-cli --global \
	&& npm cache clean --force \
	&& npm remove npm --global \
	&& apk del nodejs-npm git \
	&& rm -rf /var/cache/apk/
RUN mkdir -p /files /state
ENV VMWFILESDIR "/files"
ENV VMWSTATEDIR "/state"
ENTRYPOINT ["vmw-cli"]	
