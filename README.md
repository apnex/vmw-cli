# `vmw-cli`
**2.0 marks the first in a series of releases of the new `vmw-cli` tool and supercedes all previous versions.**  
**It has been built from the ground up to be aligned with the new `my.vmware.com` website.**  
**New features will become available in on-going releases.**  

`vmw-cli` is a CLI client used to login and interact with my.vmware.com.  
It provides an interface for programmatic query and download of VMware product binaries.  

Every product.  
Every version.  
Every file.  

`vmw-cli` uses the **my.vmware.com** Node.js SDK here: [`vmw-sdk`](https://github.com/apnex/vmw-sdk)

## Install
#### Configure authentication for my.vmware.com  
```
export VMWUSER='<username>'
export VMWPASS='<password>'
```
**Note:** Any download attempts will be restricted to the entitlements afforded by your account.  
Alternatively, if using `docker` commands, you can pass credentials directly to the container instead.

`vmw-cli` can be consumed using the Shell + Docker pre-built image (preferred), or installing the package via NPM.  
By default, requested files via the `cp` command  will be downloaded to current working directory.

### via Docker: Shell Integration
Builds a shell command that links to the docker container.  
Requires docker installed on your system.  

```
docker run apnex/vmw-cli shell > vmw-cli
chmod 755 vmw-cli
mv vmw-cli /usr/bin/
```

Once shell integration installed, `vmw-cli` can be leveraged directly via the `vmw-cli` shell command - see **Usage** below

### via NPM
**vmw-cli requires NodeJS >= 12.x, some older Linux distros need to have NodeJS [manually updated](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)**  
```
npm install vmw-cli --global
```
Once installed, `vmw-cli` can be leveraged directly via the `vmw-cli` shell command - see **Usage** below


### via Docker [Manual]
This is where we manually start the container using `docker run` with the required ENV parameters set.  
This is not required if you have performed Shell Integration.  
Subsequent commands are then issued using `docker exec` commands.  

Start the container in background:
```
docker run -itd --name vmw -e VMWUSER='<username>' -e VMWPASS='<password>' -v ${PWD}:/files --entrypoint=sh apnex/vmw-cli
```
**Where:**  
- `<username>` is your **my.vmware.com** username  
- `<password>` is your **my.vmware.com** password  
- `${PWD}` ENV will resolve to current working directory in BASH for file downloads

Then issue one or more `docker exec` commands:
```
docker exec -t vmw vmw-cli <cmd>
```

Clean up docker container when done:
```
docker rm -f vmw
```

See **Usage** for more examples  

## Overview
`vmw-cli` has been modelled to make resources on `my.vmware.com` resemble a file system.  
This allows you to **browse** available downloads via the `ls` command, and select a file to copy to your local system.

### Directory Geometry
All files are grouped into nested directory structures in the form `<category>/<version>/<type>`
**Where:**  
- `<category>` is one of the high-level solution groups listed on **my.vmware.com** 
- `<version>` is a solution version available within a specific `<category>`
- `<type>` is one of the following [`PRODUCT_BINARY`, `DRIVERS_TOOLS`, `OPEN_SOURCE`, `CUSTOM_ISO`, `ADDONS`]

For example;

Current `vmware_nsx_t_data_center` file structure:
<pre>
vmware_nsx_t_data_center
  &#x2523&#x2501 3_x
  &#x2503   &#x2523&#x2501 PRODUCT_BINARY
  &#x2503   &#x2523&#x2501 DRIVERS_TOOLS
  &#x2503   &#x2523&#x2501 OPEN_SOURCE
  &#x2503   &#x2523&#x2501 CUSTOM_ISO
  &#x2503   &#x2517&#x2501 ADDONS
  &#x2523&#x2501 2_x
  &#x2503   &#x2523&#x2501 PRODUCT_BINARY
  &#x2503   &#x2523&#x2501 DRIVERS_TOOLS
  &#x2503   &#x2523&#x2501 OPEN_SOURCE
  &#x2503   &#x2523&#x2501 CUSTOM_ISO
  &#x2503   &#x2517&#x2501 ADDONS
  &#x2517&#x2501 1_x
      &#x2523&#x2501 PRODUCT_BINARY
      &#x2523&#x2501 DRIVERS_TOOLS
      &#x2523&#x2501 OPEN_SOURCE
      &#x2523&#x2501 CUSTOM_ISO
      &#x2517&#x2501 ADDONS
</pre>

Current `vmware_vsphere` file structure:
<pre>
vmware_vsphere
  &#x2523&#x2501 7_0
  &#x2503   &#x2523&#x2501 PRODUCT_BINARY
  &#x2503   &#x2523&#x2501 DRIVERS_TOOLS
  &#x2503   &#x2523&#x2501 OPEN_SOURCE
  &#x2503   &#x2523&#x2501 CUSTOM_ISO
  &#x2503   &#x2517&#x2501 ADDONS
  &#x2523&#x2501 6_7
  &#x2503   &#x2523&#x2501 PRODUCT_BINARY
  &#x2503   &#x2523&#x2501 DRIVERS_TOOLS
  &#x2503   &#x2523&#x2501 OPEN_SOURCE
  &#x2503   &#x2523&#x2501 CUSTOM_ISO
  &#x2503   &#x2517&#x2501 ADDONS
  &#x2523&#x2501 6_5
  &#x2503   &#x2523&#x2501 PRODUCT_BINARY
  &#x2503   &#x2523&#x2501 DRIVERS_TOOLS
  &#x2503   &#x2523&#x2501 OPEN_SOURCE
  &#x2503   &#x2523&#x2501 CUSTOM_ISO
  &#x2503   &#x2517&#x2501 ADDONS
  &#x2523&#x2501 6_0
  &#x2503   &#x2523&#x2501 PRODUCT_BINARY
  &#x2503   &#x2523&#x2501 DRIVERS_TOOLS
  &#x2503   &#x2523&#x2501 OPEN_SOURCE
  &#x2503   &#x2523&#x2501 CUSTOM_ISO
  &#x2503   &#x2517&#x2501 ADDONS
  &#x2523&#x2501 5_5
  &#x2503   &#x2523&#x2501 PRODUCT_BINARY
  &#x2503   &#x2523&#x2501 DRIVERS_TOOLS
  &#x2503   &#x2523&#x2501 OPEN_SOURCE
  &#x2503   &#x2523&#x2501 CUSTOM_ISO
  &#x2503   &#x2517&#x2501 ADDONS
  &#x2523&#x2501 5_1
  &#x2503   &#x2523&#x2501 PRODUCT_BINARY
  &#x2503   &#x2523&#x2501 DRIVERS_TOOLS
  &#x2503   &#x2523&#x2501 OPEN_SOURCE
  &#x2503   &#x2523&#x2501 CUSTOM_ISO
  &#x2503   &#x2517&#x2501 ADDONS
  &#x2517&#x2501 5_0
      &#x2523&#x2501 PRODUCT_BINARY
      &#x2523&#x2501 DRIVERS_TOOLS
      &#x2523&#x2501 OPEN_SOURCE
      &#x2523&#x2501 CUSTOM_ISO
      &#x2517&#x2501 ADDONS
</pre>

And so on.

## Usage
`vmw-cli` supports the ability to **browse** available files using the `ls` command.  
You can then leverage the `cp` command to retrieve one of the listed files.  
You must execute an `ls` for the desired `<category>` before you can issue the `cp` command for a file.

#### Get root-level category listing
```
$ vmw-cli ls
```

#### View files listed under `vmware_nsx_t_data_center`
```
$ vmw-cli ls vmware_nsx_t_data_center
```

Note: This will default to latest `<version>` and `<type>` = `PRODUCT_BINARY` as they are not specified.  

#### View available versions listed under `vmware_nsx_t_data_center`
```
$ vmw-cli ls vmware_nsx_t_data_center/
```

#### View files for version `3_x` under `vmware_nsx_t_data_center`
```
$ vmw-cli ls vmware_nsx_t_data_center/3_x
```

Note: This will default `<type>` = `PRODUCT_BINARY` as it was not specified.  

#### View available types for version `3_x` under `vmware_nsx_t_data_center`
```
$ vmw-cli ls vmware_nsx_t_data_center/3_x/
```

#### View `DRIVERS_TOOLS` files for version `3_x` under `vmware_nsx_t_data_center`
```
$ vmw-cli ls vmware_nsx_t_data_center/3_x/DRIVERS_TOOLS
```

#### View `PRODUCT_BINARY` files for version `3_x` under `vmware_nsx_t_data_center`
```
$ vmw-cli ls vmware_nsx_t_data_center/3_x/PRODUCT_BINARY
```

#### Download file `nsx-unified-appliance-3.0.1.1.0.16556500.ova`
```
$ vmw-cli cp nsx-unified-appliance-3.0.1.1.0.16556500.ova 
[POST] https://my.vmware.com/channel/api/v1.0/ems/accountinfo
{
	"locale": "en_US",
	"downloadGroup": "NSX-T-30110",
	"productId": "982",
	"md5checksum": "9cf49e74d7d43c11768a04fb05f92d85",
	"tagId": 12178,
	"dlgType": "Product Binaries",
	"productFamily": "VMware NSX-T Data Center",
	"releaseDate": "2020-07-16",
	"dlgVersion": "3.0.1.1",
	"isBetaFlow": false
}
[POST] https://my.vmware.com/channel/api/v1.0/dlg/download
nsx-unified-appliance-3.0.1.1.0.16556500.ova [■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■] 100% | 0.0s | 11.02/11.02 GB
MD5 MATCH: local[ 9cf49e74d7d43c11768a04fb05f92d85 ] remote [ 9cf49e74d7d43c11768a04fb05f92d85 ]
```

File will be downloaded to current working directory.
