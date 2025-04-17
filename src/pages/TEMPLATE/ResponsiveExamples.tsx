import { SplitButtonExample } from '@/components/custom/SplitButtonExample';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { GridItem, ResponsiveGrid } from '@/components/ui/responsive-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HideAt, ShowAt } from '@/hooks/utils/use-responsive';
import { Maximize, Monitor, Smartphone, Tablet } from 'lucide-react';

export default function ResponsiveExamples() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Responsive Components
          </h1>
          <p className="text-muted-foreground">
            Examples of responsive components that adapt to different screen sizes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 my-4">
          <ShowAt breakpoint="xs">
            <Card className="bg-primary/10 border-primary p-2 px-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm font-medium">XS Breakpoint (Mobile)</span>
              </div>
            </Card>
          </ShowAt>
          
          <ShowAt breakpoint="sm">
            <Card className="bg-primary/10 border-primary p-2 px-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm font-medium">SM Breakpoint</span>
              </div>
            </Card>
          </ShowAt>
          
          <ShowAt breakpoint="md">
            <Card className="bg-primary/10 border-primary p-2 px-3">
              <div className="flex items-center gap-2">
                <Tablet className="h-4 w-4" />
                <span className="text-sm font-medium">MD Breakpoint (Tablet)</span>
              </div>
            </Card>
          </ShowAt>
          
          <ShowAt breakpoint="lg">
            <Card className="bg-primary/10 border-primary p-2 px-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="text-sm font-medium">LG Breakpoint (Desktop)</span>
              </div>
            </Card>
          </ShowAt>
          
          <ShowAt breakpoint="xl">
            <Card className="bg-primary/10 border-primary p-2 px-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="text-sm font-medium">XL Breakpoint</span>
              </div>
            </Card>
          </ShowAt>
          
          <ShowAt breakpoint="2xl">
            <Card className="bg-primary/10 border-primary p-2 px-3">
              <div className="flex items-center gap-2">
                <Maximize className="h-4 w-4" />
                <span className="text-sm font-medium">2XL Breakpoint</span>
              </div>
            </Card>
          </ShowAt>
        </div>

        <Tabs defaultValue="buttons">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="containers">Containers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buttons" className="mt-6">
            <SplitButtonExample />
          </TabsContent>
          
          <TabsContent value="grid" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Responsive Grid</CardTitle>
                <CardDescription>
                  This grid adapts the number of columns based on screen size.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveGrid
                  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
                  gap={4}
                  animate={true}
                  staggerChildren={true}
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <GridItem key={i}>
                      <Card className="h-full">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">Item {i + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-muted-foreground">
                            This card adapts to the grid layout.
                          </p>
                        </CardContent>
                      </Card>
                    </GridItem>
                  ))}
                </ResponsiveGrid>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="layout" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Conditional Rendering</CardTitle>
                <CardDescription>
                  Components that show or hide based on screen size.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ShowAt breakpoint="md" below>
                  <Card className="bg-blue-100 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="font-medium">Mobile View</h3>
                        <p className="text-sm text-muted-foreground">This section only shows on mobile devices.</p>
                      </div>
                    </CardContent>
                  </Card>
                </ShowAt>
                
                <HideAt breakpoint="md" below>
                  <Card className="bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-800">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-green-500" />
                      <div>
                        <h3 className="font-medium">Desktop View</h3>
                        <p className="text-sm text-muted-foreground">This section only shows on tablets and larger devices.</p>
                      </div>
                    </CardContent>
                  </Card>
                </HideAt>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ShowAt breakpoint="sm" above>
                    <Card className="bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-800">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Tablet className="h-5 w-5 text-purple-500" />
                        <div>
                          <h3 className="font-medium">Tablet & Up</h3>
                          <p className="text-sm text-muted-foreground">Visible on sm breakpoint and above.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </ShowAt>
                  
                  <ShowAt breakpoint="lg" above>
                    <Card className="bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Monitor className="h-5 w-5 text-amber-500" />
                        <div>
                          <h3 className="font-medium">Desktop & Up</h3>
                          <p className="text-sm text-muted-foreground">Visible on lg breakpoint and above.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </ShowAt>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="containers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Responsive Containers</CardTitle>
                <CardDescription>
                  Container components with responsive behavior.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Standard Container</h3>
                  <Container className="bg-muted p-4 rounded-lg border">
                    <p className="text-sm text-center">Standard responsive container with default settings</p>
                  </Container>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Max Width Containers</h3>
                  <div className="space-y-4">
                    <Container 
                      maxWidth={{ xs: true }}
                      className="bg-muted p-4 rounded-lg border"
                    >
                      <p className="text-sm text-center">Max width: xs</p>
                    </Container>
                    
                    <Container 
                      maxWidth={{ sm: true }}
                      className="bg-muted p-4 rounded-lg border"
                    >
                      <p className="text-sm text-center">Max width: sm</p>
                    </Container>
                    
                    <Container 
                      maxWidth={{ md: true }}
                      className="bg-muted p-4 rounded-lg border"
                    >
                      <p className="text-sm text-center">Max width: md</p>
                    </Container>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Custom Padding</h3>
                  <Container 
                    padding={{ x: { xs: 2, md: 8 }, y: { xs: 2, md: 4 } }}
                    className="bg-muted rounded-lg border"
                  >
                    <p className="text-sm text-center">Container with responsive padding</p>
                  </Container>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
} 