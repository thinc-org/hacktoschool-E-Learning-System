import { prisma } from "../common/prisma";
import { Request, Response } from "express";
import { CourseHomeDto, PartCourseHomeDto } from "../dto/common.dto";
import {
    CoursesDto,
    CreateCourseDto,
    UpdateCourseDto,
} from "../dto/course.dto";
import { courseSchema } from "../common/CourseValidator";

const amountPerPage = 12;

const getHomeCourse = async (req: Request, res: Response) => {
    const pages = parseInt(req.params.pages);
    if (isNaN(pages)) {
        res.status(404).send({ message: "invalid Pages" });
        return;
    }

    const courses = await prisma.course.findMany({
        skip: (pages - 1) * amountPerPage,
        take: amountPerPage,
    });

    let all_category: string[] = [];

    for (let i = 0; i < courses.length; i++) {
        if (!all_category.includes(courses[i].category)) {
            all_category.push(courses[i].category);
        }
    }
    all_category.sort();

    const coursesDto: CourseHomeDto = {
        all_category,
        courses: courses.map((course) => ({
            id: course.id,
            name: course.name,
            course_desc: course.course_desc,
            course_cover_url: course.course_cover_url,
        })),
    };
    res.status(200).json(coursesDto);
};

const getOneCourse = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(404).send({ message: "invalid ID" });
        return;
    }
    const course = await prisma.course.findUnique({
        where: { id },
        include: {
            studentUser: true,
        },
    });

    if (course === null) {
        res.status(404).send({ message: "not found" });
        return;
    }

    const courseDto: PartCourseHomeDto = {
        id: course.id,
        name: course.name,
        course_desc: course.course_desc,
        course_cover_url: course.course_cover_url,
    };

    res.status(200).json(courseDto);
};

const searchCourse = async (req: Request, res: Response) => {
    const search = req.query.search as string | null;
    const pages = parseInt(req.params.pages);

    if (isNaN(pages)) {
        res.status(404).send({ message: "invalid Pages" });
        return;
    }

    let courses;

    if (search == null) {
        // courses = await prisma.course.findMany({
        //     skip: (pages - 1) * amountPerPage,
        //     take: amountPerPage,
        // });
        res.status(404).send({ message: "not found" });
        return;
    } else {
        const search_arr = search.split("+");
        const new_search = search_arr.join(" & ");

        courses = await prisma.course.findMany({
            where: {
                name: {
                    search: new_search,
                },
            },
            skip: (pages - 1) * amountPerPage,
            take: amountPerPage,
        });

        console.log("search by: " + new_search);
    }

    if (courses === null) {
        res.status(404).send({ message: "not found" });
        return;
    }

    const coursesDto: CoursesDto = {
        total: courses.length,
        courses: courses.map((course) => ({
            id: course.id,
            name: course.name,
            course_desc: course.course_desc,
            course_cover_url: course.course_cover_url,
        })),
    };

    res.status(200).json(coursesDto);
};

const getCategoryCourse = async (req: Request, res: Response) => {
    const pages = parseInt(req.params.pages);
    if (isNaN(pages)) {
        res.status(404).send({ message: "invalid Pages" });
        return;
    }

    // const category = req.params.cat.toUpperCase();
    const category = req.params.cat;
    const courses = await prisma.course.findMany({
        where: { category },
        include: {
            studentUser: true,
        },
        skip: (pages - 1) * amountPerPage,
        take: amountPerPage,
    });

    if (courses === null) {
        res.status(404).send({ message: "not found" });
        return;
    }

    const coursesDto: CoursesDto = {
        total: courses.length,
        courses: courses.map((course) => ({
            id: course.id,
            name: course.name,
            course_desc: course.course_desc,
            course_cover_url: course.course_cover_url,
        })),
    };

    res.status(200).json(coursesDto);
};

const createCourse = async (req: Request, res: Response) => {
    const course: CreateCourseDto = req.body;
    const check = courseSchema.safeParse(course);
    if (check.success) {
        try {
            const result = await prisma.course.create({
                data: {
                    name: course.name,
                    category: course.category,
                    course_desc: course.course_desc,
                    course_detail: course.course_detail,
                    course_cover_url: course.course_cover_url,
                    guide_url: course.guide_url,
                    course_material: course.course_material,
                    instructor_id: course.instructor_id,
                    max_student: course.max_student,
                    curr_student: course.curr_student,
                },
            });

            console.log(result);

            res.status(201).json(result);
        } catch (e) {
            console.log(e);
            res.status(400).json({ message: "something wents wrong" });
        }
    } else {
        res.status(400).json({ message: "something went wrong" });
    }
};

const updateCourse = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const newCourseDto: UpdateCourseDto = req.body;
    const check = courseSchema.safeParse(newCourseDto);

    if (check.success) {
        const course = await prisma.course.update({
            where: { id },
            data: {
                name: newCourseDto.name,
                category: newCourseDto.category,
                course_desc: newCourseDto.course_desc,
                course_detail: newCourseDto.course_detail,
                course_cover_url: newCourseDto.course_cover_url,
                guide_url: newCourseDto.guide_url,
                course_material: newCourseDto.course_material,
                instructor_id: newCourseDto.instructor_id,
                max_student: newCourseDto.max_student,
                curr_student: newCourseDto.curr_student,
            },
        });
        res.status(200).json(course);
    } else {
        res.status(400).json({ message: "something went wrong" });
    }
};

const deleteCourse = async (req: Request, res: Response) => {
    const id = req.params.id;
    await prisma.course.delete({
        where: {
            id: parseInt(id),
        },
    });
    res.status(204).send();
};

export {
    getOneCourse,
    searchCourse,
    getCategoryCourse,
    getHomeCourse,
    createCourse,
    updateCourse,
    deleteCourse,
};
