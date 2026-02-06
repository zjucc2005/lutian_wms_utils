# -*- encoding:utf-8 -*-
# 金蝶BOS平台python脚本，http request样例
import clr

clr.AddReference('System')
clr.AddReference('System.Web.Extensions')
clr.AddReference('Kingdee.BOS')
clr.AddReference('Kingdee.BOS.App')
clr.AddReference('Kingdee.BOS.Core')
clr.AddReference('Newtonsoft.Json')

import sys
from System import *
from System.Collections.Generic import *
from System.Threading import *
from System.IO import *
from System.Net import *
from System.Text import *
from System.Security.Cryptography import *
from System.Web.Script.Serialization import *
from System.Collections.Generic import Dictionary
from Newtonsoft.Json.Linq import *

def httpGet(url):
    request = WebRequest.Create(url)
    request.Method = 'GET'
    # request.ContentType = 'text/html;charset=UTF-8'
    request.ContentType = 'application/json'
    response = request.GetResponse()
    stream_reader = StreamReader(response.GetResponseStream(), Encoding.GetEncoding('utf-8'))
    return stream_reader.ReadToEnd()

def httpPost(url, data):
    request = WebRequest.Create(url)
    request.Method = 'POST'
    request.ContentType = 'application/x-www-form-urlencoded'
    request.Accept = 'application/json'
    byte_data = Encoding.UTF8.GetBytes(data)
    request.ContentLength = byte_data.Length
    req_stream = request.GetRequestStream()
    req_stream.Write(byte_data, 0, byte_data.Length)
    req_stream.Flush()
    req_stream.Close()
    response = request.GetResponse()
    stream_reader = StreamReader(response.GetResponseStream(), Encoding.GetEncoding('utf-8'))
    return stream_reader.ReadToEnd()
 
def CallbackEvent(e):
    # url = 'https://zjucc2005.github.io/lutian_wms_utils/package.json'
    url = 'http://192.168.0.161:18088/sipmweb/api/oauth?uname=蔡畅&passwd=1c63129ae9db9c60c3e8aa94d3e00495&f=true'
    result = httpGet(url)
    this.View.ShowMessage(str(result))
 