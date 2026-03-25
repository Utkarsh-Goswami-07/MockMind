"use client";
import { saveResume } from '@/actions/resume';
import { resumeSchema } from '@/app/lib/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import useFetch from '@/hooks/use-fetch';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Download, Edit, Loader2, Monitor, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form';
import EntryForm from './entry-form';
import { entriesToMarkdown } from '@/app/lib/helper';
import MDEditor from '@uiw/react-md-editor';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

const ResumeBuilder = ({ initialContent }) => {
    const [activeTab, setActiveTab] = useState('edit');
    const [resumeMode, setResumeMode] = useState("preview");
    const [previewContent, setPreviewContent] = useState(initialContent);
    const [isGenerating, setIsGenerating] = useState(false);
    const { user } = useUser();

    const {
        control,
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(resumeSchema),
        defaultValues: {
            contactInfo: {},
            summary: "",
            skills: "",
            experience: [],
            education: [],
            projects: []
        }
    });

    const {
        loading: isSaving,
        fn: saveResumeFn,
        data: saveResult,
        error: saveError
    } = useFetch(saveResume)

    const formValues = watch();

    useEffect(() => {
        if (initialContent) {
            setActiveTab("preview");
        }
    }, [initialContent])

    useEffect(() => {
        if (activeTab === 'edit') {
            const newContent = getCombinedContent();
            setPreviewContent(newContent ? newContent : initialContent)
        }
    }, [formValues, activeTab])

    const getContactMarkdown = () => {
        const { contactInfo } = formValues;
        const parts = [];
        if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
        if (contactInfo.mobile) parts.push(`📱 ${contactInfo.mobile}`);
        if (contactInfo.linkedin) parts.push(`💼 ${contactInfo.linkedin}`);
        if (contactInfo.twitter) parts.push(`🐦 [Twitter](${contactInfo.twitter})`);

        return parts.length > 0
            ? `## <div align='center'>${user?.fullName || ""}</div>
        \n\n<div align='center'>\n\n${parts.join(" | ")}\n\n</div>`
            : "";
    }

    const getCombinedContent = () => {
        const { summary, skills, experience, education, projects } = formValues;

        return [
            getContactMarkdown(),
            summary && `## Professional Summary\n\n${summary}`,
            skills && `## Skills\n\n${skills}`,
            entriesToMarkdown(experience, "Work Experience"),
            entriesToMarkdown(education, "Education"),
            entriesToMarkdown(projects, "Projects")
        ]
            .filter(Boolean).join("\n\n")
    }

    useEffect(() => {
        if (saveResult && !isSaving) {
            toast.success("Resume saved successfully");
        }

        if (saveError) {
            toast.error(saveError.message || "Failed to save resume");
        }
    }, [saveResult, saveError, isSaving])

    const onSubmit = async () => {
        try {
            const formattedContent = previewContent
                .replace(/\n/g, "\n")
                .replace(/\n\s*\n/g, "\n\n")
                .trim();

            console.log(previewContent, formattedContent);
            await saveResumeFn(previewContent);
        } catch (error) {
            console.error("Save error:", error);
        }
    }

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const MarkdownIt = (await import("markdown-it")).default;
            const md = new MarkdownIt({ html: true });
            const htmlContent = md.render(previewContent || "");

            const printWindow = window.open("", "_blank");
            printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${user?.fullName || "resume"}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            font-size: 14px;
                            line-height: 1.6;
                            color: black;
                            background: white;
                            padding: 40px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        h1, h2, h3 { color: black; margin-top: 20px; }
                        ul { padding-left: 20px; }
                        a { color: black; }
                        p { margin: 8px 0; }
                        @media print {
                            body { padding: 20px; }
                        }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            }
                        }
                    </script>
                </body>
            </html>
        `);
            printWindow.document.close();
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className='space-y-4'>
            <div className='flex flex-col md:flex-row justify-between items-center gap-2'>
                <h1 className='bg-gradient-to-b from-gray-400 via-gray-200 to-gray-600 font-extrabold tracking-tighter text-transparent bg-clip-text pb-2 pr-2 text-5xl md:text-6xl'>Resume Builder</h1>

                <div className='space-x-2'>
                    <Button variant={'destructive'} onClick={onSubmit}>
                        {isSaving ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className='h-4 w-4' />
                                Save
                            </>
                        )}
                    </Button>
                    <Button onClick={generatePDF} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download className='h-4 w-4' />
                                Download PDF
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="edit">Form</TabsTrigger>
                    <TabsTrigger value="preview">Markdown</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                    <form className='space-y-8'>
                        <div className='space-y-2 mt-4'>
                            <h3 className='text-lg font-medium'>Contact Information</h3>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50'>
                                <div className='space-y-2'>
                                    <label className='text-sm font-medium'>Email</label>
                                    <Input
                                        {...register("contactInfo.email")}
                                        type={'email'}
                                        placeholder="your@email.com"
                                    />
                                    {errors.contactInfo?.email && (
                                        <p className='text-sm text-red-500'>
                                            {errors.contactInfo.email.message}
                                        </p>
                                    )}
                                </div>

                                <div className='space-y-2'>
                                    <label className='text-sm font-medium'>Mobile Number</label>
                                    <Input
                                        {...register("contactInfo.mobile")}
                                        type={'tel'}
                                        placeholder="+1 111 222 3333"
                                    />
                                    {errors.contactInfo?.mobile && (
                                        <p className='text-sm text-red-500'>
                                            {errors.contactInfo.mobile.message}
                                        </p>
                                    )}
                                </div>

                                <div className='space-y-2'>
                                    <label className='text-sm font-medium'>LinkedIn Url</label>
                                    <Input
                                        {...register("contactInfo.linkedin")}
                                        type={'url'}
                                        placeholder="https://linkedin.com/in/your-profile"
                                    />
                                    {errors.contactInfo?.linkedin && (
                                        <p className='text-sm text-red-500'>
                                            {errors.contactInfo.linkedin.message}
                                        </p>
                                    )}
                                </div>

                                <div className='space-y-2'>
                                    <label className='text-sm font-medium'>Twitter / X Url</label>
                                    <Input
                                        {...register("contactInfo.twitter")}
                                        type={'url'}
                                        placeholder="https://x.com/your_username"
                                    />
                                    {errors.contactInfo?.twitter && (
                                        <p className='text-sm text-red-500'>
                                            {errors.contactInfo.twitter.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className='space-y-4'>
                            <h3>Professional Summary</h3>
                            <Controller
                                name='summary'
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        className='h-32 resize-none'
                                        placeholder='Write a compelling professional summary...'
                                        error={errors.summary}
                                    />
                                )}
                            />
                            {errors.summary && (
                                <p className='text-sm text-red-500'>{errors.summary.message}</p>
                            )}
                        </div>

                        <div className='space-y-4'>
                            <h3>Skills</h3>
                            <Controller
                                name='skills'
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        className='h-32 resize-none'
                                        placeholder='Let us know how skilled you are...'
                                        error={errors.skills}
                                    />
                                )}
                            />
                            {errors.skills && (
                                <p className='text-sm text-red-500'>{errors.skills.message}</p>
                            )}
                        </div>

                        <div className='space-y-4'>
                            <h3>Work Experience</h3>
                            <Controller
                                name='experience'
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type="Experience"
                                        entries={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {errors.experience && (
                                <p className='text-sm text-red-500'>{errors.experience.message}</p>
                            )}
                        </div>

                        <div className='space-y-4'>
                            <h3>Education</h3>
                            <Controller
                                name='education'
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type="Education"
                                        entries={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {errors.education && (
                                <p className='text-sm text-red-500'>{errors.education.message}</p>
                            )}
                        </div>

                        <div className='space-y-4'>
                            <h3>Projects</h3>
                            <Controller
                                name='projects'
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type="Project"
                                        entries={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {errors.projects && (
                                <p className='text-sm text-red-500'>{errors.projects.message}</p>
                            )}
                        </div>
                    </form>
                </TabsContent>
                <TabsContent value="preview">
                    <Button variant={'link'} type='button' className={'mb-2'}
                            onClick={() => {
                                setResumeMode(resumeMode === 'preview' ? 'edit' : 'preview')
                            }}
                    >
                        {resumeMode === 'preview' ? (
                            <>
                                <Edit className='h-4 w-4' />
                                Edit Resume
                            </>
                        ) : (
                            <>
                                <Monitor className='h-4 w-4' />
                                Show Preview
                            </>
                        )}
                    </Button>
                    {resumeMode !== 'preview' && (
                        <div className='flex p-3 gap-2 items-center border-2 border-lime-600 text-lime-600 rounded mb-2'>
                            <AlertTriangle className='h-5 w-5' />
                            <span className='text-sm'>
                                You will lose edited markdown if you update the form data.
                            </span>
                        </div>
                    )}
                    <div className='border rounded-lg'>
                        <MDEditor
                            value={previewContent}
                            onChange={setPreviewContent}
                            height={800}
                            preview={resumeMode}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ResumeBuilder