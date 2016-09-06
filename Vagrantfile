# -*- mode: ruby -*-
# vi: set ft=ruby :

# Icinga Web 2 | (c) 2013-2015 Icinga Development Team | GPLv2+

VAGRANTFILE_API_VERSION = "2"
VAGRANT_REQUIRED_VERSION = "1.5.0"

if ! defined? Vagrant.require_version
  if Gem::Version.new(Vagrant::VERSION) < Gem::Version.new(VAGRANT_REQUIRED_VERSION)
    puts "Vagrant >= " + VAGRANT_REQUIRED_VERSION + " required. Your version is " + Vagrant::VERSION
    exit 1
  end
else
  Vagrant.require_version ">= " + VAGRANT_REQUIRED_VERSION
end

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.ssh.insert_key = false

  config.vm.network "forwarded_port", guest: 80, host: 8080,
    auto_correct: true

  config.vm.provision :shell, :path => ".vagrant-puppet/manifests/puppet.sh"

  config.vm.provider :parallels do |p, override|
    override.vm.box = "parallels/centos-6.7"

    p.name = "inGraph Development"

    # Update Parallels Tools automatically
#    p.update_guest_tools = true

    # Set power consumption mode to "Better Performance"
    p.optimize_power_consumption = false

    p.memory = 1024
    p.cpus = 2
  end

  config.vm.provision :puppet do |puppet|
    puppet.module_path = ".vagrant-puppet/modules"
    puppet.manifests_path = ".vagrant-puppet/manifests"
  end
end
