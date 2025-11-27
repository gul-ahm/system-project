getwd()
setwd('E:/agri_credit')

library(tidyverse)

# data --------------------------------------------------------------------

net1 <- readxl::read_xlsx("netl/Natl Receipt 18-19.xlsx")
net1 %>% head()
View(net1)

net1 <- net1 %>% mutate(YEAR = year(Date),
                        MONTH = month(Date)) 



net2 <- readxl::read_xlsx("netl/Natl Receipt 19-20.xlsx")
net2 %>% head()


net2 <- net2 %>% mutate(YEAR = year(Date),
                        MONTH = month(Date)) 



net3 <- readxl::read_xlsx("netl/Natl Receipt 19-20.xlsx")
net3 %>% head()


net3 <- net3 %>% mutate(YEAR = year(Date),
                        MONTH = month(Date))



net4 <- readxl::read_xlsx("netl/Natl Receipt 20-21.xlsx")
net4 %>% head()


net4 <- net4 %>% mutate(YEAR = year(Date),
                        MONTH = month(Date))



net5 <- readxl::read_xlsx("netl/Natl Receipt 21-22.xlsx")
net5 %>% head()


net5 <- net5 %>% mutate(YEAR = year(Date),
                        MONTH = month(Date)) 



net6 <- readxl::read_xlsx("netl/Natl Receipt 22-23.xlsx")
net6 %>% head()


net6 <- net6 %>% mutate(YEAR = year(Date),
                        MONTH = month(Date)) 


net7 <- readxl::read_xlsx("netl/Natl Receipt 23-24.xlsx")
net7 %>% head()


net7 <- net7 %>% mutate(YEAR = year(Date),
                        MONTH = month(Date)) 


# merge all ---------------------------------------------------------------

net_reciepts <- rbind(net1, net2, net4, net5, net6, net7)

net_reciepts %>% write_csv("net_reciepts_combined.csv")


net_reciepts %>% View()


# Sales -------------------------------------------------------------------
sl1 <- readxl::read_xlsx('sales_reg/Natl Sales 18-19.xlsx')
sl2 <- readxl::read_xlsx('sales_reg/Sale Natl 19-20.xlsx')
sl3 <- readxl::read_xlsx('sales_reg/Sale Natl 20-21.xlsx', skip = 9)
sl4 <- readxl::read_xlsx('sales_reg/Sale Natl 21-22.xlsx')
sl5 <- readxl::read_xlsx('sales_reg/Sale Natl 22-23.xlsx')

sl1 <- sl1 %>% mutate(YEAR = year(Date), MONTH = month(Date) ) 


sl2 <- sl2 %>% mutate(YEAR = year(Date), MONTH = month(Date) ) 

sl3 <- sl3 %>% mutate(YEAR = year(Date), MONTH = month(Date) ) 



sl4 <- sl4 %>% mutate(YEAR = year(Date), MONTH = month(Date) ) 



sl5 <- sl5 %>% mutate(YEAR = year(Date), MONTH = month(Date) )



sales_register <- rbind(sl1,sl2,sl4,sl5)
sales_register %>% head()

sales_register %>% write_csv("sales_register_combined.csv")


# erge --------------------------------------------------------------------



sales_register %>% left_join(net_reciepts)



sales_register %>% filter(Particulars=='Sri Anantha Agro Agencies, Bhadrachalam') %>% 
  select(Date,Particulars, `Gross Total`)%>% summarise(sum=sum(`Gross Total`))



net_reciepts %>% filter(Particulars=='Sri Anantha Agro Agencies, Bhadrachalam')%>% 
  select(Date,Particulars, Credit) %>% ungroup() %>% summarise(sum=sum(Credit))




