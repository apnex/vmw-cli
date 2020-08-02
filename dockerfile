FROM alpine
RUN	apk --no-cache add \
	nodejs \
	nodejs-npm \
	&& npm install npm@latest vmw-cli --global \
	&& npm cache clean --force \
	&& npm remove npm --global
RUN mkdir -p /files /state
ENV VMWFILESDIR "/files"
ENV VMWSTATEDIR "/state"
ENTRYPOINT ["vmw-cli"]	
