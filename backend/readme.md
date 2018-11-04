# Backend

## Setup

1. Create a virtual python environment with python 3.6: 

```
virtualenv -p python3.6 venv
```

2. activate virtualenv:
```
source venv/bin/activate
```
3. install requirements:
```
pip install -r requirements.txt
```
4. install prosody: https://prosody.im/download/
5. copy the prosody config file into the prosody config folder (config folder location might depend on operating system)
```
sudo cp prosody/prosody.cfg.lua /etc/prosody/prosody.cfg.lua
```
6. generate ssl certificates (make sure the certs are in the location which is specified in the config file):
```
sudo prosodyctl cert generate localhost
```
7. start prosody:
```
sudo prosodyctl start
```
8. Prosody can be stopped with the following command:
```
sudo prosodyctl stop
```

## Creating Graphs
Run:
```
python graphcreator.py
```

## Running the simulation
Run:
```
python simulation.py
```




